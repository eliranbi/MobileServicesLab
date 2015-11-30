/*
 * IBM Confidential OCO Source Materials
 *
 * Copyright IBM Corp. 2006, 2013
 *
 * The source code for this program is not published or otherwise
 * divested of its trade secrets, irrespective of what has
 * been deposited with the U.S. Copyright Office.
 *
 */

#import "IMFDefaultGoogleAuthenticationDelegate.h"

@implementation IMFDefaultGoogleAuthenticationDelegate

- (void) authenticationHandler:(IMFGoogleAuthenticationHandler *)authenticationHandler didReceiveAuthenticationRequestForClientId:(NSString *)clientId {
    GPPSignIn *signIn = [GPPSignIn sharedInstance];
    signIn.shouldFetchGooglePlusUser = YES;
    signIn.shouldFetchGoogleUserEmail = YES;
    signIn.clientID = clientId;
    signIn.scopes = @[ kGTLAuthScopePlusUserinfoProfile ];
    signIn.delegate = self;
    [signIn authenticate];
}

- (void) finishedWithAuth:(GTMOAuth2Authentication *)auth error:(NSError *)error {
    if (!error) {
        NSString *idToken = [[auth parameters] valueForKey:@"id_token"];
        [[IMFGoogleAuthenticationHandler sharedInstance] didFinishGoogleAuthenticationWithIdToken:idToken];
    } else {
        NSLog(@"Cannot receive id token from google %@", [error description]);
        [[IMFGoogleAuthenticationHandler sharedInstance] didFailGoogleAuthenticationWithUserInfo:error.userInfo];
    }
}


@end
