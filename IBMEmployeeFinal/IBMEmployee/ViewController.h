//
//  ViewController.h
//  IBMEmployee
//
//  Created by Eliran BenIshay on 11/16/15.
//  Copyright © 2015 Eliran BenIshay. All rights reserved.
//

#import <UIKit/UIKit.h>

@interface ViewController : UIViewController <UITextFieldDelegate>

@property (strong, nonatomic) IBOutlet UITextField *username;

@property (strong, nonatomic) IBOutlet UITextField *password;
- (IBAction)loginBtn:(id)sender;

@end

