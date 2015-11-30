/*
 * Licensed Materials - Property of IBM
 * (C) Copyright IBM Corp. 2006, 2013. All Rights Reserved.
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
 */

#import <Foundation/Foundation.h>
#import "IMFGoogleAuthenticationDelegate.h"
#import <GoogleOpenSource/GoogleOpenSource.h>
#import <GooglePlus/GooglePlus.h>

/**
 *  Enables default Google authentication
 * 
 *  To use a default Google delegate, call <p>
 *  <code>[[IMFGoogleAuthenticationHandler sharedInstance] registerWithDefaultDelegate]</code> 
 *  <p>
 *  before any call to a protected resource.
 */
@interface IMFDefaultGoogleAuthenticationDelegate : NSObject <IMFGoogleAuthenticationDelegate, GPPSignInDelegate>

@end
