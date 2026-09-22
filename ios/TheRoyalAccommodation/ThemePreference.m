//
//  ThemePreference.m
//  ShiftHappens
//
//  Created by IT Oasis on 18/10/2025.
//

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(ThemePreference, NSObject)

RCT_EXTERN_METHOD(setDarkModeEnabled:(BOOL)enabled)
RCT_EXTERN_METHOD(getDarkModeEnabled:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end