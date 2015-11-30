/*
 * Licensed Materials - Property of IBM
 * (C) Copyright IBM Corp. 2006, 2013. All Rights Reserved.
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
 */

#import <Foundation/Foundation.h>
#import <IMFCore/IMFCore.h>
#import <GoogleOpenSource/GoogleOpenSource.h>
#import <GooglePlus/GooglePlus.h>
#import "IMFGoogleAuthenticationDelegate.h"

@protocol IMFGoogleAuthenticationDelegate;
/**
 *  Provides functionalities for connecting Advanced Mobile Access with Google.
 */
@interface IMFGoogleAuthenticationHandler : NSObject <IMFAuthenticationDelegate> {
    
}

/**
 *  Singleton for IMFGoogleAuthenticationHandler
 *
 *  @return Shared instance of IMFGoogleAuthenticationHandler
 */
+(IMFGoogleAuthenticationHandler*) sharedInstance;

/**
 *  Registers the default delegate that does the Google authentication, without writing additional code
 * 
 *  Call this method before any request to a protected resource.
 */
-(void) registerWithDefaultDelegate;

/**
 *  Registers a custom Google delegate
 *
 *  @param googleAuthenticationDelegate Custom Google authentication delegate
 */
-(void) registerWithDelegate:(id<IMFGoogleAuthenticationDelegate>) googleAuthenticationDelegate;

/**
 *  Passes the googleIdToken back to Advanced Mobile Access.
 *
 *  @param googleIdToken Google id token received as a result of the Google authentication
 */
-(void) didFinishGoogleAuthenticationWithIdToken:(NSString*) googleIdToken;

/**
 *  Called whenever there was a problem receiving the Google id token
 *
 *  @param userInfo Error user info
 */
-(void) didFailGoogleAuthenticationWithUserInfo:(NSDictionary*) userInfo;

/**
 *  Enables continued work with the application in case the user starts the login to Google but does not complete it
 * 
 *  Add this method to your application delegate applicationDidBecomeActive.
 *  
 */
-(void) handleDidBecomeActive;

/**
 *  Enables continued work with the application in case the user starts the login to Google but does not complete it.
 *  
 *  Add this method to your application delegate openURL.
 *  
 *  @param isGoogleSigninInURL Indicates whether the URL scheme belongs to Google
 */
- (void) handleOpenURL:(BOOL) isGoogleURL;

@end

@interface IMFGoogleAuthentication : NSObject

/**
 * Returns the current IMFGoogleAuthentication version
 */
+(NSString*) version;
@end
