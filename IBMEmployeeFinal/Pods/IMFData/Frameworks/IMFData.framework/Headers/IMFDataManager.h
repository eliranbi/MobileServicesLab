/*
 * IBM Confidential OCO Source Materials
 *
 * 5725-I43 Copyright IBM Corp. 2015, 2015
 *
 * The source code for this program is not published or otherwise
 * divested of its trade secrets, irrespective of what has
 * been deposited with the U.S. Copyright Office.
 *
 */


#import <Foundation/Foundation.h>
#import <IMFCore/IMFCore.h>

@class CDTReplicatorFactory;
@class CDTDatastoreManager;
@class CDTPushReplication;
@class CDTPullReplication;
@class CDTStore;
@protocol CDTObjectMapper;

#define DB_ACCESS_GROUP_ADMINS @"admins"
#define DB_ACCESS_GROUP_MEMBERS @"members"

@class IMFDataManager;

/**
 @warning The IMFData framework has been deprecated.  Please migrate to https://github.com/cloudant/CDTDatastore
 
 The IMFDataManager is the central point for interacting with the Cloudant NoSQL database
 */
__deprecated
@interface IMFDataManager : NSObject

/**
 The default CDTObjectMapper associated with the IMFDataManager instance.  All CDTStore objects created by this IMFDataManager will be configured to use this defaultMapper
 */
@property (nonatomic, strong) id<CDTObjectMapper> defaultMapper;

/**
 The CDTDatastoreManager associated with the IMFDataManager
 */
@property (readonly, atomic) CDTDatastoreManager *datastoreManager;

/**
 The CDTReplicatorFactory associated with the IMFDataManager
 */
@property (readonly, atomic) CDTReplicatorFactory *replicatorFactory;

/**
 Provides access to the IMFDataManager instance.  Initialization is performed on the first access.
 @return The sharedInstance of the IMFDataManager
 */
+(instancetype) sharedInstance;

/**
 Creates a local CDTStore.
 @param name The name of the store.
 @param error Cause of failure or nil if successful
 @return The local CDTStore instance
 */
-(CDTStore*) localStore: (NSString*) name error: (NSError**) error;

/**
 Creates a remote CDTStore.
 @param name The name of the data store
 @param completionHandler The completion handler that gets invoked when the operation is completed
 */
-(void) remoteStore: (NSString*) name completionHandler: (void(^) (CDTStore *store, NSError *error)) completionHandler;

/**
 Generates a CDTPullReplication object to be used to replicate with local CDTStore created with this manager
 @param name the name of the data store to replicate from remote to local
 @return the CDTPullReplication object
 */
-(CDTPullReplication*) pullReplicationForStore: (NSString*) name;

/**
 Generates a CDTPushReplication object to be used to replicate with local Store created with this manager.
 @param name the name of the data store to replicate from local to remote
 @return the CDTPushReplication object
 */
-(CDTPushReplication*) pushReplicationForStore: (NSString*) name;


/**
 Sets user permissions on a remote Cloudant database.
 @param access Specifies the access group to which to add the user.  Valid values are admins or members.  For convenience, constants are provided above (DB_ACCESS_GROUP_ADMINS and DB_ACCESS_GROUP_MEMBERS)
 @param storeName Specifies the name of the remote Cloudant database on which to set permissions.
 @param completionHandler The completion handler used to receive result
 */
-(void) setCurrentUserPermissions:(NSString*)access forStoreName:(NSString*)storeName completionHander: (void(^) (BOOL success, NSError *error)) completionHandler;

@end

/**
 @warning The IMFData framework has been deprecated.  Please migrate to https://github.com/cloudant/CDTDatastore
 
 IMFData provides the current version of the IMFData framework.
 */
@interface IMFData : NSObject

/**
 @return The version of the IMFData framework.
 */
+(NSString*) version;

/**
 @return The current deployment target for this SDK.  It is Cloud
 */
+(NSString*) deployment;

/**
 @return The build date for this SDK.
 */
+(NSString*) buildDate;

@end
