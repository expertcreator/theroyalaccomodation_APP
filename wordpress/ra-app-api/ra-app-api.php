<?php
/**
 * Plugin Name: RA App API
 * Description: Bridge between The Royal Accommodation mobile app and the website. Public, read-only routes for occupied dates, nightly rates and reviews; a contact-enquiry route that sends email; and "My Bookings" — for the signed-in app user (Firebase sign-in token) or server-to-server (shared secret). Reads OWcal data; never writes to it.
 * Version:     1.3.0
 * Author:      RTD / ITOasis
 * Requires PHP: 7.4
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // No direct access.
}

/**
 * ------------------------------------------------------------------
 *  CONFIG
 * ------------------------------------------------------------------
 *  The shared secret (server-to-server /my-bookings only) is read from
 *  wp-config.php, NOT from this file, so it never lives in the plugin zip
 *  or in version control:
 *
 *      define( 'RA_APP_SECRET', 'paste-a-long-random-string-here' );
 *
 *  Until that constant is defined, /my-bookings stays closed (503).
 *
 *  The app's own route (/me/bookings) needs no secret — it checks the
 *  guest's Firebase sign-in token instead. The Firebase project it trusts
 *  can be overridden in wp-config.php if it ever changes:
 *
 *      define( 'RA_APP_FIREBASE_PROJECT_ID', 'the-royal-accommodation' );
 *
 *  Statuses that are NOT real, live bookings are hidden from the app.
 *  Override in wp-config.php if the client's OWcal is configured
 *  differently, e.g. define( 'RA_APP_HIDDEN_STATUSES', 'waiting_payment,cancelled' );
 * ------------------------------------------------------------------
 */
if ( ! defined( 'RA_APP_HIDDEN_STATUSES' ) ) {
	define( 'RA_APP_HIDDEN_STATUSES', 'waiting_payment,cancelled,multi_resa_pending' );
}

if ( ! defined( 'RA_APP_FIREBASE_PROJECT_ID' ) ) {
	define( 'RA_APP_FIREBASE_PROJECT_ID', 'the-royal-accommodation' );
}

/**
 * OWcal accommodation IDs the app knows about, mapped to its property slugs.
 * One place to add a residence.
 */
function ra_app_accom_map() {
	return array(
		1680 => 'ascot',
		1225 => 'windsor',
	);
}

/**
 * Map an OWcal accommodation ID to the app's property slug.
 */
function ra_app_property_slug( $accom_id ) {
	$map      = ra_app_accom_map();
	$accom_id = (int) $accom_id;
	return isset( $map[ $accom_id ] ) ? $map[ $accom_id ] : null;
}

/**
 * Register the REST route: POST /wp-json/ra-app/v1/my-bookings
 */
add_action( 'rest_api_init', function () {
	register_rest_route(
		'ra-app/v1',
		'/my-bookings',
		array(
			'methods'             => 'POST',
			'callback'            => 'ra_app_my_bookings',
			'permission_callback' => '__return_true', // real auth is the shared secret, checked in the callback
		)
	);
} );

/**
 * One consistent response envelope for every outcome.
 */
function ra_app_response( $success, $message, $data, $http = 200 ) {
	return new WP_REST_Response(
		array(
			'success' => (bool) $success,
			'message' => $message,
			'data'    => $data,
		),
		$http
	);
}

/**
 * Same envelope, but never cached — for one person's private data.
 * (The site has page caching on; two guests must never see each other's bookings.)
 */
function ra_app_private_response( $success, $message, $data, $http = 200 ) {
	$response = ra_app_response( $success, $message, $data, $http );
	$response->header( 'Cache-Control', 'no-store, private, max-age=0' );
	return $response;
}

/**
 * The guest's live bookings, looked up by email.
 * Shared by /my-bookings (secret) and /me/bookings (Firebase token).
 *
 * Returns the list (empty if they have none), or null if OWcal isn't active.
 */
function ra_app_bookings_for_email( $email ) {
	// OWcal must be active.
	if ( ! class_exists( 'OwDataBaseActions' ) ) {
		return null;
	}

	$owdb = new OwDataBaseActions();

	// Look the customer up by email (emails are unique in OWcal's customers table).
	$customer = $owdb->get_customer_by_email( $email );
	if ( ! $customer || empty( $customer['id'] ) ) {
		// A real guest who simply has no bookings on the booking system — not an error.
		return array();
	}

	// Read their reservations (raw wp_ow_resa rows, newest first).
	$rows = $owdb->get_all_resa_by_date_by_customer( (int) $customer['id'] );
	if ( ! is_array( $rows ) ) {
		$rows = array();
	}

	$hidden   = array_filter( array_map( 'trim', explode( ',', RA_APP_HIDDEN_STATUSES ) ) );
	$bookings = array();

	foreach ( $rows as $r ) {
		if ( ! isset( $r['status'] ) || in_array( $r['status'], $hidden, true ) ) {
			continue; // hide abandoned / cancelled / half-finished rows
		}
		$bookings[] = ra_app_map_reservation( $r );
	}

	return $bookings;
}

/**
 * The endpoint (server-to-server, shared secret).
 */
function ra_app_my_bookings( WP_REST_Request $req ) {

	// 1. Secret must be configured server-side, and must match (timing-safe).
	if ( ! defined( 'RA_APP_SECRET' ) || RA_APP_SECRET === '' ) {
		return ra_app_response( false, 'Endpoint not configured.', null, 503 );
	}
	$sent = (string) $req->get_header( 'x-ra-secret' );
	if ( ! hash_equals( RA_APP_SECRET, $sent ) ) {
		return ra_app_response( false, 'Unauthorized.', null, 401 );
	}

	// 2. Validate input.
	$email = sanitize_email( (string) $req->get_param( 'email' ) );
	if ( ! $email || ! is_email( $email ) ) {
		return ra_app_response( false, 'A valid email is required.', null, 400 );
	}

	// 3. Look up their bookings.
	$bookings = ra_app_bookings_for_email( $email );
	if ( null === $bookings ) {
		return ra_app_response( false, 'Booking system unavailable.', null, 503 );
	}

	return ra_app_private_response( true, 'OK', array( 'bookings' => $bookings ) );
}

/**
 * Raw wp_ow_resa row -> the safe, minimal shape the app receives.
 * Only the fields My Bookings needs; nothing sensitive (no token/uid/payment_info).
 */
function ra_app_map_reservation( array $r ) {
	$accom_id = isset( $r['accom_id'] ) ? (int) $r['accom_id'] : 0;
	$total    = isset( $r['price'] ) ? (float) $r['price'] : 0.0;
	$paid     = ra_app_amount_paid( $r, $total );

	return array(
		'ref'           => isset( $r['alphanum_id'] ) ? $r['alphanum_id'] : '',
		'accomId'       => $accom_id,
		'property'      => ra_app_property_slug( $accom_id ),   // 'ascot' | 'windsor' | null
		'checkIn'       => isset( $r['check_in'] ) ? $r['check_in'] : '',
		'checkOut'      => isset( $r['check_out'] ) ? $r['check_out'] : '',
		'adults'        => isset( $r['adults'] ) ? (int) $r['adults'] : 0,
		'children'      => isset( $r['children'] ) ? (int) $r['children'] : 0,
		'status'        => isset( $r['status'] ) ? $r['status'] : '',
		'paymentStatus' => isset( $r['payment_status'] ) ? $r['payment_status'] : '',
		'total'         => $total,
		'paid'          => $paid,                                    // from OWcal's payment entries
		'amountToPay'   => max( 0.0, round( $total - $paid, 2 ) ),   // balance still due
		'currency'      => isset( $r['currency'] ) ? $r['currency'] : '',
		'bookedOn'      => isset( $r['received_on'] ) ? $r['received_on'] : '',
	);
}

/**
 * How much the guest has actually paid for this reservation.
 *
 * OWcal records every payment in the reservation's `payments_logs` column —
 * the "Edit payments" list in OWcal admin — as JSON entries with `amount` and
 * `refunded_amount`. (Its old `paid` column isn't kept up to date, so we don't use it.)
 *
 * When a guest books several properties at once, OWcal keeps the payments on a
 * "parent" booking; for those we read the parent's payments, capped at this
 * property's price.
 */
function ra_app_amount_paid( array $r, $price ) {
	$parent_id = isset( $r['parent_id'] ) ? (int) $r['parent_id'] : 0;

	if ( $parent_id > 0 ) {
		$owdb     = new OwDataBaseActions();
		$payments = $owdb->get_resa_payments_logs( $parent_id, true );
	} else {
		$payments = isset( $r['payments_logs'] ) ? json_decode( (string) $r['payments_logs'], true ) : array();
	}
	if ( ! is_array( $payments ) ) {
		$payments = array();
	}

	$paid = 0.0;
	foreach ( $payments as $payment ) {
		if ( ! is_array( $payment ) ) {
			continue;
		}
		// A delayed payment (e.g. still processing at the bank) hasn't arrived yet.
		if ( isset( $payment['delayed'] ) && 'yes' === $payment['delayed'] ) {
			continue;
		}
		$amount   = isset( $payment['amount'] ) ? (float) $payment['amount'] : 0.0;
		$refunded = isset( $payment['refunded_amount'] ) ? (float) $payment['refunded_amount'] : 0.0;
		$paid    += $amount - $refunded;
	}

	if ( $parent_id > 0 ) {
		$paid = min( $paid, (float) $price ); // the parent's payments cover several properties
	}

	return max( 0.0, round( $paid, 2 ) );
}

/**
 * ==================================================================
 *  MY BOOKINGS FOR THE SIGNED-IN APP USER
 *  POST /wp-json/ra-app/v1/me/bookings
 * ==================================================================
 *  The app sends the guest's Firebase sign-in token in the
 *  X-Firebase-Token header. We check the token ourselves:
 *    - signed by Google (using Google's published keys),
 *    - issued for OUR Firebase project,
 *    - not expired,
 *    - and the email is verified.
 *  Then we return the bookings for the email INSIDE the token —
 *  never an email sent by the app. No secret lives on the phone.
 *
 *  Error replies carry data.code so the app knows what to show:
 *    invalid-token (401), email-not-verified (403), unavailable (503).
 * ------------------------------------------------------------------
 */
add_action( 'rest_api_init', function () {
	register_rest_route(
		'ra-app/v1',
		'/me/bookings',
		array(
			'methods'             => 'POST',
			'callback'            => 'ra_app_me_bookings',
			'permission_callback' => '__return_true', // real auth is the Firebase token, checked in the callback
		)
	);
} );

function ra_app_me_bookings( WP_REST_Request $req ) {

	// 1. Check the Firebase sign-in token.
	$claims = ra_app_verify_firebase_token( (string) $req->get_header( 'x-firebase-token' ) );
	if ( is_wp_error( $claims ) ) {
		if ( 'keys-unavailable' === $claims->get_error_code() ) {
			// We couldn't fetch Google's keys — our problem, not the guest's.
			return ra_app_private_response( false, 'Could not check your sign-in right now. Please try again.', array( 'code' => 'unavailable' ), 503 );
		}
		return ra_app_private_response( false, 'Please sign in again.', array( 'code' => 'invalid-token' ), 401 );
	}

	// 2. The email must be verified — otherwise someone could register with
	//    another person's email address and see their bookings.
	$verified = isset( $claims['email_verified'] ) && true === $claims['email_verified'];
	if ( empty( $claims['email'] ) || ! $verified ) {
		return ra_app_private_response( false, 'Please verify your email address to view your bookings.', array( 'code' => 'email-not-verified' ), 403 );
	}

	// 3. Look up the bookings for the email inside the token.
	$email    = sanitize_email( strtolower( (string) $claims['email'] ) );
	$bookings = ra_app_bookings_for_email( $email );
	if ( null === $bookings ) {
		return ra_app_private_response( false, 'Booking system unavailable.', array( 'code' => 'unavailable' ), 503 );
	}

	return ra_app_private_response( true, 'OK', array( 'bookings' => $bookings ) );
}

/**
 * Check a Firebase ID token. Returns its claims (array) on success, or a WP_Error.
 *
 * Follows Firebase's guide "Verify ID tokens using a third-party JWT library":
 * https://firebase.google.com/docs/auth/admin/verify-id-tokens
 * The token itself is never logged or stored.
 */
function ra_app_verify_firebase_token( $token ) {
	// A token has three dot-separated parts: header.payload.signature
	$parts = explode( '.', $token );
	if ( 3 !== count( $parts ) ) {
		return new WP_Error( 'invalid-token', 'Malformed token.' );
	}
	list( $header_b64, $payload_b64, $signature_b64 ) = $parts;

	$header    = json_decode( ra_app_base64url_decode( $header_b64 ), true );
	$claims    = json_decode( ra_app_base64url_decode( $payload_b64 ), true );
	$signature = ra_app_base64url_decode( $signature_b64 );
	if ( ! is_array( $header ) || ! is_array( $claims ) || '' === $signature ) {
		return new WP_Error( 'invalid-token', 'Malformed token.' );
	}

	// 1. Header: must be RS256 and name one of Google's signing keys.
	if ( ! isset( $header['alg'], $header['kid'] ) || 'RS256' !== $header['alg'] ) {
		return new WP_Error( 'invalid-token', 'Unexpected token type.' );
	}
	$certs = ra_app_firebase_certs();
	if ( empty( $certs ) ) {
		return new WP_Error( 'keys-unavailable', 'Could not load Google signing keys.' );
	}
	if ( ! isset( $certs[ $header['kid'] ] ) ) {
		return new WP_Error( 'invalid-token', 'Unknown signing key.' );
	}

	// 2. Signature: proves Google issued this token and nobody changed it.
	$public_key = openssl_pkey_get_public( $certs[ $header['kid'] ] );
	if ( ! $public_key || 1 !== openssl_verify( $header_b64 . '.' . $payload_b64, $signature, $public_key, OPENSSL_ALGO_SHA256 ) ) {
		return new WP_Error( 'invalid-token', 'Bad signature.' );
	}

	// 3. Claims: issued for OUR project, by Firebase, and still valid.
	$project = RA_APP_FIREBASE_PROJECT_ID;
	$now     = time();
	$leeway  = 60; // allow for small clock differences between servers

	if ( ! isset( $claims['aud'] ) || $project !== $claims['aud'] ) {
		return new WP_Error( 'invalid-token', 'Token is for a different project.' );
	}
	if ( ! isset( $claims['iss'] ) || 'https://securetoken.google.com/' . $project !== $claims['iss'] ) {
		return new WP_Error( 'invalid-token', 'Unexpected token issuer.' );
	}
	if ( empty( $claims['sub'] ) || ! is_string( $claims['sub'] ) ) {
		return new WP_Error( 'invalid-token', 'Token has no user.' );
	}
	if ( ! isset( $claims['exp'] ) || (int) $claims['exp'] < $now - $leeway ) {
		return new WP_Error( 'invalid-token', 'Token has expired.' );
	}
	if ( ! isset( $claims['iat'] ) || (int) $claims['iat'] > $now + $leeway ) {
		return new WP_Error( 'invalid-token', 'Token issued in the future.' );
	}
	if ( isset( $claims['auth_time'] ) && (int) $claims['auth_time'] > $now + $leeway ) {
		return new WP_Error( 'invalid-token', 'Sign-in time is in the future.' );
	}

	return $claims;
}

/**
 * Google's current public certificates for Firebase ID tokens, keyed by key id.
 * Cached for as long as Google says (Cache-Control max-age), so we rarely fetch.
 * Returns an empty array if they can't be loaded.
 */
function ra_app_firebase_certs() {
	$cached = get_transient( 'ra_app_firebase_certs' );
	if ( is_array( $cached ) && ! empty( $cached ) ) {
		return $cached;
	}

	$res = wp_remote_get(
		'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com',
		array( 'timeout' => 10 )
	);
	if ( is_wp_error( $res ) || 200 !== (int) wp_remote_retrieve_response_code( $res ) ) {
		return array();
	}

	$certs = json_decode( wp_remote_retrieve_body( $res ), true );
	if ( ! is_array( $certs ) || empty( $certs ) ) {
		return array();
	}

	// Keep them as long as Google allows (usually a few hours); default 1 hour.
	$ttl = HOUR_IN_SECONDS;
	if ( preg_match( '/max-age=(\d+)/', (string) wp_remote_retrieve_header( $res, 'cache-control' ), $m ) ) {
		$ttl = max( 60, (int) $m[1] );
	}
	set_transient( 'ra_app_firebase_certs', $certs, $ttl );

	return $certs;
}

/**
 * Base64url (used in tokens) -> raw bytes. Returns '' if it isn't valid.
 */
function ra_app_base64url_decode( $input ) {
	$b64 = strtr( (string) $input, '-_', '+/' );
	$pad = strlen( $b64 ) % 4;
	if ( $pad ) {
		$b64 .= str_repeat( '=', 4 - $pad );
	}
	$out = base64_decode( $b64, true );
	return false === $out ? '' : $out;
}

/**
 * ------------------------------------------------------------------
 *  PUBLIC availability endpoint — occupied dates for the app calendar.
 *  GET /wp-json/ra-app/v1/availability?accomId=1680&from=YYYY-MM-DD&to=YYYY-MM-DD
 *
 *  Occupied dates are public information (already shown on the website's
 *  own calendar), so this route needs NO secret — the app calls it
 *  directly. Read-only: reservations + admin/iCal blocks. Never writes.
 * ------------------------------------------------------------------
 */
add_action( 'rest_api_init', function () {
	register_rest_route(
		'ra-app/v1',
		'/availability',
		array(
			'methods'             => 'GET',
			'callback'            => 'ra_app_availability',
			'permission_callback' => '__return_true',
		)
	);
} );

function ra_app_is_ymd( $s ) {
	return is_string( $s ) && preg_match( '/^\d{4}-\d{2}-\d{2}$/', $s ) && strtotime( $s ) !== false;
}

function ra_app_availability( WP_REST_Request $req ) {
	$accom_id = (int) $req->get_param( 'accomId' );
	$from     = sanitize_text_field( (string) $req->get_param( 'from' ) );
	$to       = sanitize_text_field( (string) $req->get_param( 'to' ) );

	if ( ! $accom_id || ! ra_app_is_ymd( $from ) || ! ra_app_is_ymd( $to ) ) {
		return ra_app_response( false, 'accomId, from and to (YYYY-MM-DD) are required.', null, 400 );
	}
	if ( strtotime( $to ) < strtotime( $from ) ) {
		return ra_app_response( false, 'Invalid date range (to is before from).', null, 400 );
	}

	// Cap the window (max ~400 nights) so the response stays small.
	if ( ( strtotime( $to ) - strtotime( $from ) ) / DAY_IN_SECONDS > 400 ) {
		$to = gmdate( 'Y-m-d', strtotime( $from ) + 400 * DAY_IN_SECONDS );
	}

	if ( ! class_exists( 'OwDataBaseActions' ) ) {
		return ra_app_response( false, 'Booking system unavailable.', null, 503 );
	}

	global $wpdb;
	$owdb          = new OwDataBaseActions();
	$resa_table    = $owdb->resa_table;
	$blocked_table = $owdb->accom_blocked_table;

	// Statuses that occupy dates — mirror OWcal's own availability logic.
	$exclude = array( 'cancelled', 'pending', 'multi_resa_pending' );
	if ( get_option( 'ow_resa_paid_has_confirmation' ) === 'yes' ) {
		$exclude[] = 'waiting_payment';
	}
	$status_ph = implode( ',', array_fill( 0, count( $exclude ), '%s' ) );

	// Reservations overlapping [from, to)
	$resas = $wpdb->get_results(
		$wpdb->prepare(
			"SELECT check_in, check_out FROM $resa_table
			 WHERE accom_id = %d AND status NOT IN ( $status_ph )
			   AND check_out > %s AND check_in < %s",
			array_merge( array( $accom_id ), $exclude, array( $from, $to ) )
		),
		ARRAY_A
	);

	// Admin / iCal blocks overlapping [from, to)
	$blocks = $wpdb->get_results(
		$wpdb->prepare(
			"SELECT from_date AS check_in, to_date AS check_out FROM $blocked_table
			 WHERE accom_id = %d AND to_date > %s AND from_date < %s",
			$accom_id,
			$from,
			$to
		),
		ARRAY_A
	);

	$quantity = (int) get_post_meta( $accom_id, 'accom_quantity', true );
	if ( $quantity < 1 ) {
		$quantity = 1;
	}

	// Count overlapping units per night; a night is occupied when count >= units.
	$counts = array();
	foreach ( array_merge( (array) $resas, (array) $blocks ) as $row ) {
		ra_app_add_nights( $counts, $row['check_in'], $row['check_out'], $from, $to );
	}

	$occupied = array();
	foreach ( $counts as $date => $n ) {
		if ( $n >= $quantity ) {
			$occupied[] = $date;
		}
	}
	sort( $occupied );

	return ra_app_response(
		true,
		'OK',
		array(
			'accomId'  => $accom_id,
			'from'     => $from,
			'to'       => $to,
			'occupied' => $occupied,
		)
	);
}

/**
 * Add each night in [start, end) that falls inside [win_from, win_to) to $counts.
 * `end` is exclusive — the check-out day stays free for a new arrival, matching
 * OWcal's own overlap logic and the app's hasOccupiedInRange guard.
 */
function ra_app_add_nights( array &$counts, $start, $end, $win_from, $win_to ) {
	$s = ( strcmp( $start, $win_from ) > 0 ) ? $start : $win_from; // max(start, win_from)
	$e = ( strcmp( $end, $win_to ) < 0 ) ? $end : $win_to;         // min(end, win_to)
	try {
		$sd = new DateTimeImmutable( $s . ' 00:00:00', new DateTimeZone( 'UTC' ) );
		$ed = new DateTimeImmutable( $e . ' 00:00:00', new DateTimeZone( 'UTC' ) );
	} catch ( Exception $ex ) {
		return;
	}
	for ( $d = $sd; $d < $ed; $d = $d->modify( '+1 day' ) ) {
		$key            = $d->format( 'Y-m-d' );
		$counts[ $key ] = isset( $counts[ $key ] ) ? $counts[ $key ] + 1 : 1;
	}
}

/**
 * ------------------------------------------------------------------
 *  PUBLIC rates endpoint — lowest / highest nightly rate per residence.
 *  GET /wp-json/ra-app/v1/rates
 *
 *  Nightly rates are public (shown on the website), so no secret. The app
 *  fetches this once at startup and shows "from £X / night" on Home.
 *
 *  Source: OWcal's own rate rows (type = 'accom' = the per-night base rate),
 *  joined to each accommodation. `from` = lowest such rate, `to` = highest.
 *  This is the true, bookable floor/ceiling — it updates automatically when
 *  the client edits their rates in OWcal. Read-only. Never writes.
 * ------------------------------------------------------------------
 */
add_action( 'rest_api_init', function () {
	register_rest_route(
		'ra-app/v1',
		'/rates',
		array(
			'methods'             => 'GET',
			'callback'            => 'ra_app_rates',
			'permission_callback' => '__return_true',
		)
	);
} );

function ra_app_rates( WP_REST_Request $req ) {
	if ( ! class_exists( 'OwDataBaseActions' ) ) {
		return ra_app_response( false, 'Booking system unavailable.', null, 503 );
	}

	global $wpdb;
	$owdb              = new OwDataBaseActions();
	$rates_table       = $owdb->rates_table;
	$rates_accom_table = $owdb->rates_accom_table;
	$resa_table        = $owdb->resa_table;

	// Currency: read it from the most recent reservation that carries one; fall back to GBP.
	$currency = $wpdb->get_var( "SELECT currency FROM $resa_table WHERE currency <> '' ORDER BY id DESC LIMIT 1" );
	if ( empty( $currency ) ) {
		$currency = 'GBP';
	}

	$out = array();

	foreach ( ra_app_accom_map() as $accom_id => $slug ) {
		// Base nightly rates for this accommodation (type = 'accom' excludes
		// extra-adult / extra-child surcharges). Amounts across all seasons.
		$amounts = $wpdb->get_col(
			$wpdb->prepare(
				"SELECT r.amount
				 FROM $rates_table r
				 INNER JOIN $rates_accom_table ra ON ra.rate_id = r.id
				 WHERE ra.accom_id = %d AND r.type = %s",
				$accom_id,
				'accom'
			)
		);

		$amounts = array_map( 'floatval', (array) $amounts );
		$amounts = array_values( array_filter( $amounts, function ( $a ) {
			return $a > 0;
		} ) );

		$out[ (string) $accom_id ] = array(
			'accomId'  => (int) $accom_id,
			'property' => $slug,
			'from'     => ! empty( $amounts ) ? min( $amounts ) : null, // lowest bookable nightly
			'to'       => ! empty( $amounts ) ? max( $amounts ) : null, // highest nightly
			'currency' => $currency,
		);
	}

	return ra_app_response( true, 'OK', $out );
}


/**
 * ------------------------------------------------------------------
 *  PUBLIC reviews endpoint — average rating + count + list per residence.
 *  GET /wp-json/ra-app/v1/reviews
 *
 *  Reviews are public (shown on the website). Source: the ACF-backed
 *  `reviews` post type, linked to an accommodation via the
 *  `review_property-relationship` field (holds the accom post ID).
 *  Returns per-residence average, count, and the individual reviews
 *  (never the private_feedback field). Read-only. Never writes.
 * ------------------------------------------------------------------
 */
add_action( 'rest_api_init', function () {
	register_rest_route(
		'ra-app/v1',
		'/reviews',
		array(
			'methods'             => 'GET',
			'callback'            => 'ra_app_reviews',
			'permission_callback' => '__return_true',
		)
	);
} );

function ra_app_reviews( WP_REST_Request $req ) {
	$accom_map = ra_app_accom_map();

	// One bucket per known accommodation (so every residence is present, even with 0 reviews).
	$buckets = array();
	foreach ( $accom_map as $accom_id => $slug ) {
		$buckets[ (int) $accom_id ] = array(
			'accomId'  => (int) $accom_id,
			'property' => $slug,
			'average'  => 0.0,
			'count'    => 0,
			'reviews'  => array(),
			'_sum'     => 0.0,
		);
	}

	// Published reviews only (excludes revisions/drafts).
	$posts = get_posts( array(
		'post_type'        => 'reviews',
		'post_status'      => 'publish',
		'numberposts'      => 200,
		'orderby'          => 'date',
		'order'            => 'DESC',
		'suppress_filters' => true,
	) );

	foreach ( (array) $posts as $post ) {
		$rating = (float) get_post_meta( $post->ID, 'review_rating', true );

		// review_property-relationship is an ACF field holding the linked accom ID(s).
		$prop_raw = get_post_meta( $post->ID, 'review_property-relationship', true );
		$prop_ids = array();
		foreach ( (array) $prop_raw as $pid ) {
			$pid = (int) $pid;
			if ( $pid > 0 ) {
				$prop_ids[] = $pid;
			}
		}
		$prop_ids = array_unique( $prop_ids );

		$review = array(
			'headline' => (string) get_post_meta( $post->ID, 'review_headline', true ),
			'reviewer' => (string) get_post_meta( $post->ID, 'review_reviewer-name', true ),
			'date'     => (string) get_post_meta( $post->ID, 'review_date', true ),
			'rating'   => $rating,
			'text'     => (string) get_post_meta( $post->ID, 'review_text', true ),
			'agency'   => (string) get_post_meta( $post->ID, 'review_agency', true ),
			// NB: review_private_feedback is intentionally NEVER included.
		);

		foreach ( $prop_ids as $pid ) {
			if ( ! isset( $buckets[ $pid ] ) ) {
				continue; // only residences the app knows about
			}
			$buckets[ $pid ]['reviews'][] = $review;
			$buckets[ $pid ]['count']    += 1;
			$buckets[ $pid ]['_sum']     += $rating;
		}
	}

	$out = array();
	foreach ( $buckets as $accom_id => $b ) {
		$count        = (int) $b['count'];
		$b['average'] = $count > 0 ? round( $b['_sum'] / $count, 1 ) : 0.0;
		unset( $b['_sum'] );
		$out[ (string) $accom_id ] = $b;
	}

	return ra_app_response( true, 'OK', $out );
}

/**
 * ==================================================================
 *  SEND ENQUIRY  —  app "Contact → Send Enquiry" form
 * ==================================================================
 *  POST /wp-json/ra-app/v1/enquiry
 *    body: name, email, message   (required)
 *          phone, property        (optional)
 *          company                (honeypot — the app always sends it empty)
 *
 *  What it does on submit:
 *    1. Emails the business a branded notification (Reply-To = the guest,
 *       so the client can reply to the enquirer directly).
 *    2. Emails the guest a branded "thank you, we'll be in touch" note.
 *
 *  Delivery is WordPress mail (FluentSMTP is active on this site, so it's
 *  reliable). This is a PUBLIC contact form — no secret — protected by a
 *  honeypot + a light per-IP rate limit. It only sends email; it stores
 *  nothing in WP.
 *
 *  Recipient: define RA_APP_ENQUIRY_TO in wp-config.php to control where
 *  leads go, e.g.
 *      define( 'RA_APP_ENQUIRY_TO', 'info@theroyalaccommodation.com' );
 *  If that constant is absent it falls back to the site admin email.
 *
 *  Optional overrides (wp-config.php / filters):
 *    - RA_APP_EMAIL_LOGO : logo image URL for the email header
 *    - filter 'ra_app_enquiry_to'       : change the recipient
 *    - filter 'ra_app_enquiry_send_ack' : return false to disable the
 *                                         guest acknowledgement
 * ------------------------------------------------------------------
 */

/**
 * Register the enquiry route: POST /wp-json/ra-app/v1/enquiry
 */
add_action( 'rest_api_init', function () {
	register_rest_route(
		'ra-app/v1',
		'/enquiry',
		array(
			'methods'             => 'POST',
			'callback'            => 'ra_app_enquiry',
			'permission_callback' => '__return_true', // public contact form; honeypot + rate limit guard it
		)
	);
} );

/**
 * Best-effort client IP — used only to rate-limit enquiries.
 */
function ra_app_client_ip() {
	$ip = isset( $_SERVER['REMOTE_ADDR'] ) ? (string) $_SERVER['REMOTE_ADDR'] : '';
	return sanitize_text_field( $ip );
}

/**
 * Logo URL for the enquiry email header:
 *   explicit RA_APP_EMAIL_LOGO override → site custom logo → none (text fallback).
 */
function ra_app_email_logo_url() {
	if ( defined( 'RA_APP_EMAIL_LOGO' ) && RA_APP_EMAIL_LOGO ) {
		return RA_APP_EMAIL_LOGO;
	}
	$logo_id = get_theme_mod( 'custom_logo' );
	if ( $logo_id ) {
		$url = wp_get_attachment_image_url( $logo_id, 'full' );
		if ( $url ) {
			return $url;
		}
	}
	return '';
}

/**
 * Wrap the enquiry email body in a branded, cream-background shell with the
 * logo on top — so app emails match the look of the website's own emails.
 */
function ra_app_email_wrap( $inner_html ) {
	$site = esc_html( wp_specialchars_decode( get_bloginfo( 'name' ), ENT_QUOTES ) );
	$logo = ra_app_email_logo_url();
	$logo_html = $logo
		? '<img src="' . esc_url( $logo ) . '" alt="' . esc_attr( $site ) . '" style="max-width:220px;height:auto;display:block;margin:0 auto;" />'
		: '<div style="font-size:18px;letter-spacing:2px;color:#0B2A12;font-weight:600;text-align:center;">' . $site . '</div>';

	return '<!DOCTYPE html><html><body style="margin:0;padding:0;background:#FAF8F3;">'
		. '<div style="max-width:560px;margin:0 auto;padding:32px 24px;font-family:Arial,Helvetica,sans-serif;color:#1A1A1A;">'
		. '<div style="text-align:center;margin-bottom:24px;">' . $logo_html . '</div>'
		. $inner_html
		. '</div></body></html>';
}

/**
 * One label / value line for the enquiry details table.
 */
function ra_app_email_row( $label, $value ) {
	return '<tr>'
		. '<td style="padding:6px 10px 6px 0;color:#8A8A8A;white-space:nowrap;vertical-align:top;">' . esc_html( $label ) . '</td>'
		. '<td style="padding:6px 0;color:#1A1A1A;">' . esc_html( $value ) . '</td>'
		. '</tr>';
}

/**
 * The enquiry endpoint — validates the form, then emails the business and
 * (by default) the guest.
 */
function ra_app_enquiry( WP_REST_Request $req ) {

	// 1. Honeypot — a hidden field the app always leaves empty. If a bot
	//    fills it, pretend success so the bot learns nothing.
	if ( trim( (string) $req->get_param( 'company' ) ) !== '' ) {
		return ra_app_response( true, 'Thank you for your enquiry.', null );
	}

	// 2. Light rate limit: max 5 enquiries per IP per 10 minutes (stops the
	//    public endpoint being abused to spam the acknowledgement email).
	$rl_key = 'ra_app_enq_' . md5( ra_app_client_ip() );
	$rl     = (int) get_transient( $rl_key );
	if ( $rl >= 5 ) {
		return ra_app_response( false, 'Too many enquiries. Please try again later.', null, 429 );
	}
	set_transient( $rl_key, $rl + 1, 10 * MINUTE_IN_SECONDS );

	// 3. Validate + sanitize the incoming fields.
	$name     = sanitize_text_field( (string) $req->get_param( 'name' ) );
	$email    = sanitize_email( (string) $req->get_param( 'email' ) );
	$phone    = sanitize_text_field( (string) $req->get_param( 'phone' ) );
	$property = sanitize_text_field( (string) $req->get_param( 'property' ) );
	$message  = sanitize_textarea_field( (string) $req->get_param( 'message' ) );

	if ( $name === '' || ! $email || ! is_email( $email ) || $message === '' ) {
		return ra_app_response( false, 'Name, a valid email and a message are required.', null, 400 );
	}

	// 4. Where the lead goes. Default = the client's inbox; override in
	//    wp-config.php with RA_APP_ENQUIRY_TO, or via the filter below.
	$default_to = 'info@theroyalaccommodation.com';
	$to = ( defined( 'RA_APP_ENQUIRY_TO' ) && RA_APP_ENQUIRY_TO ) ? RA_APP_ENQUIRY_TO : $default_to;
	$to = apply_filters( 'ra_app_enquiry_to', $to );

	$site_html = esc_html( wp_specialchars_decode( get_bloginfo( 'name' ), ENT_QUOTES ) );

			// 5. Business notification (branded HTML). Reply-To = the guest so the
	//    client can reply straight back to them.
	$subject = sprintf( 'New enquiry from %s', $name );
	$inner   = '<table style="width:100%;border-collapse:collapse;font-size:14px;">'
		. ra_app_email_row( 'Name', $name )
		. ra_app_email_row( 'Email', $email )
		. ra_app_email_row( 'Phone', $phone !== '' ? $phone : '—' )
		. ra_app_email_row( 'Interested property', $property !== '' ? $property : 'Not specified' )
		. '</table>'
		. '<p style="font-size:14px;margin:18px 0 0;"><strong>Message</strong><br>' . nl2br( esc_html( $message ) ) . '</p>'
		. '<p style="margin-top:24px;font-size:12px;color:#8A8A8A;text-align:center;">Received via The Royal Accommodation app</p>';

	$headers = array(
		'Content-Type: text/html; charset=UTF-8',
		sprintf( 'Reply-To: %s <%s>', $name, $email ),
	);

	$sent = wp_mail( $to, $subject, ra_app_email_wrap( $inner ), $headers );
	if ( ! $sent ) {
		return ra_app_response( false, 'Could not send your enquiry. Please try again.', null, 500 );
	}

	// 6. Guest acknowledgement (branded HTML). On by default; disable by
	//    returning false from the 'ra_app_enquiry_send_ack' filter.
	if ( apply_filters( 'ra_app_enquiry_send_ack', true ) ) {
		$ack_subject = sprintf( 'Thank you for your enquiry — %s', wp_specialchars_decode( get_bloginfo( 'name' ), ENT_QUOTES ) );
		$ack_inner   = '<p style="font-size:15px;margin:0 0 12px;">Hi ' . esc_html( $name ) . ',</p>'
			. '<p style="font-size:14px;line-height:1.6;margin:0;">Thank you for your enquiry. We\'ll be in touch as soon as possible, typically within 24 hours.</p>'
			. '<p style="font-size:14px;margin:20px 0 0;">Kind regards,<br>' . $site_html . '</p>';
		wp_mail( $email, $ack_subject, ra_app_email_wrap( $ack_inner ), array( 'Content-Type: text/html; charset=UTF-8' ) );
	}

	// 7. Done — the app shows "Enquiry received".
	return ra_app_response( true, 'Thank you for your enquiry.', null );
}
