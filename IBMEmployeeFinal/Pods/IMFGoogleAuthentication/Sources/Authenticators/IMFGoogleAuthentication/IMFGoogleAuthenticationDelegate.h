/*
 * Licensed Materials - Property of IBM
 * (C) Copyright IBM Corp. 2006, 2013. All Rights Reserved.
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
 */

#import <Foundation/Foundation.h>
#import "IMFGoogleAuthenticationHandler.h"

@class IMFGoogleAuthenticationHandler;

/**
 *  Implements custom Google authentication
 */
@protocol IMFGoogleAuthenticationDelegate <NSObject>

/**
 *  Calls Google sign-in
 *
 *  @param authenticationHandler Google authentication handler.  This handler receives the id token when sign-in is complete.
 *  @param clientId Client id received from the dashboard
 */

- (void)authenticationHandler: (IMFGoogleAuthenticationHandler *) authenticationHandler didReceiveAuthenticationRequestForClientId:(NSString*)clientId;

@end
