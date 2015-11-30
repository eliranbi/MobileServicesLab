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


#import <IMFCore/IMFCore.h>

#import "IMFGoogleAuthenticationHandler.h"
#import "IMFDefaultGoogleAuthenticationDelegate.h"
#import "IMFGoogleAuthenticationDelegate.h"


@interface IMFGoogleAuthenticationHandler ()
@property id<IMFGoogleAuthenticationDelegate> googleAuthenticationDelegate;
@property id<IMFAuthenticationContext> currentContext;
@end

@implementation IMFGoogleAuthenticationHandler

@synthesize googleAuthenticationDelegate, currentContext;

BOOL isGoogleSigninInProgress = NO;
NSString *const GOOGLE_REALM = @"wl_googleRealm";

+(IMFGoogleAuthenticationHandler*) sharedInstance {
    static IMFGoogleAuthenticationHandler *sharedInstance = nil;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        sharedInstance = [[self alloc] init];
    });
    return sharedInstance;
}

- (id)init {
    if (self = [super init]) {
        //initialize default values here
    }
    return self;
}

-(void) registerWithDefaultDelegate {
    IMFLogDebugWithName(IMF_OAUTH_PACKAGE, @"[OAuth] registerWithDefaultDelegate start");
    [self registerWithDelegate:[[IMFDefaultGoogleAuthenticationDelegate alloc] init]];
    IMFLogDebugWithName(IMF_OAUTH_PACKAGE, @"[OAuth] registerWithDefaultDelegate end");
}

-(void) registerWithDelegate:(id<IMFGoogleAuthenticationDelegate>)googleAuthenticationHandlerDelegate {
    IMFLogDebugWithName(IMF_OAUTH_PACKAGE, @"[OAuth] registerWithDelegate start");
    [self setGoogleAuthenticationDelegate:googleAuthenticationHandlerDelegate];
    [[IMFClient sharedInstance] registerAuthenticationDelegate:self forRealm:GOOGLE_REALM];
    IMFLogDebugWithName(IMF_OAUTH_PACKAGE, @"[OAuth] registerWithDelegate end");
}

-(void) authenticationContext:(id<IMFAuthenticationContext>)context didReceiveAuthenticationChallenge:(NSDictionary *)challenge {
    if (self.googleAuthenticationDelegate != nil){
        [self setCurrentContext:context];
        NSString *clientId = [challenge valueForKey:@"gClientId"];
        isGoogleSigninInProgress = YES;
        [[self googleAuthenticationDelegate] authenticationHandler:self didReceiveAuthenticationRequestForClientId:clientId];
    } else {
       IMFLogDebugWithName(IMF_OAUTH_PACKAGE, @"[OAuth] Google authentication delegate cannot be nil");
    }
}

-(void) didFinishGoogleAuthenticationWithIdToken:(NSString*) googleIdToken {
    if (googleIdToken != nil){
        [currentContext submitAuthenticationChallengeAnswer:[NSDictionary dictionaryWithObject:googleIdToken forKey:@"idToken"]];
        isGoogleSigninInProgress = NO;
        currentContext = nil;
    }
}

-(void) didFailGoogleAuthenticationWithUserInfo:(NSDictionary*) userInfo{
    [currentContext submitAuthenticationFailure:userInfo];
    isGoogleSigninInProgress = NO;
    currentContext = nil;
}


-(void) authenticationContext:(id<IMFAuthenticationContext>)context didReceiveAuthenticationFailure:(NSDictionary *)userInfo {
    currentContext = nil;
}

- (void) authenticationContext:(id<IMFAuthenticationContext>)context didReceiveAuthenticationSuccess:(NSDictionary *)userInfo {
    currentContext = nil;
}

-(void) handleDidBecomeActive {
     // If Google sign-in interrupted, report failure 
    if (isGoogleSigninInProgress){
        [[GPPSignIn sharedInstance] disconnect];
        [self didFailGoogleAuthenticationWithUserInfo :[NSDictionary dictionaryWithObject:@"Google sign-in did not finish" forKey:@"error"]];
    }
}

- (void) handleOpenURL:(BOOL) isGoogleURL {
    if (isGoogleSigninInProgress) {
        isGoogleSigninInProgress = !isGoogleURL;
    }
}



@end

#define IMF_GOOGLE_AUTHENTICATION_VERSION     @"1.0"

@implementation IMFGoogleAuthentication
/**
 * Returns the current IMFGoogleAuthentication version
 */
+(NSString*) version {
    return IMF_GOOGLE_AUTHENTICATION_VERSION;
}
@end

