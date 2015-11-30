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
#import <IMFData/IMFDataManager.h>

@protocol CDTEncryptionKeyProvider;

@interface IMFDataManager(EncryptionKey)

/**
 Returns a local CDTStore for the given name. It also requires a key provider, the key returned by this
 provider will be used to cipher the CDTStore (attachments and extensions not included). The
 provider is always mandatory, in case you do not want to encrypt the data, you have to supply a
 CDTEncryptionKeyNilProvider instance or any other object that conforms to protocol
 CDTEncryptionKeyProvider and returns nil when the key is requested.
 @param name The name of the store.
 @param provider It returns the key to cipher the CDTStore
 @param error Cause of failure or nil if successful
 @return The local CDTStore instance
 
 */
-(CDTStore*) localStore: (NSString*) name withEncryptionKeyProvider:(id<CDTEncryptionKeyProvider>)provider error: (NSError**) error;

/**
 Generates a CDTPullReplication object to be used to replicate with local CDTStore created with this manager
 @param name the name of the data store to replicate from remote to local
 @param provider It returns the key to cipher the local CDTStore
 @return the CDTPullReplication object
 */
-(CDTPullReplication*) pullReplicationForStore: (NSString*) name withEncryptionKeyProvider:(id<CDTEncryptionKeyProvider>)provider;

/**
 Generates a CDTPushReplication object to be used to replicate with local Store created with this manager.
 @param name the name of the data store to replicate from local to remote
 @param provider It returns the key to cipher the local CDTStore
 @return the CDTPushReplication object
 */
-(CDTPushReplication*) pushReplicationForStore: (NSString*) name withEncryptionKeyProvider:(id<CDTEncryptionKeyProvider>)provider;

@end