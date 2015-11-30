//
//  ViewController.m
//  IBMEmployee
//
//  Created by Eliran BenIshay on 11/16/15.
//  Copyright © 2015 Eliran BenIshay. All rights reserved.
//

#import "ViewController.h"

@interface ViewController ()

@end

@implementation ViewController

@synthesize username;
@synthesize password;


- (void)viewDidLoad {
    [super viewDidLoad];
    // Do any additional setup after loading the view, typically from a nib.

    username.delegate = self;
    password.delegate = self;
    password.secureTextEntry = YES;

    
    [self.navigationController setNavigationBarHidden:YES];
    [self.navigationController setTitle:@"Login"];

    
}

- (void)didReceiveMemoryWarning {
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}


- (void) touchesBegan:(NSSet *)touches withEvent:(UIEvent *)event{
    [username resignFirstResponder];
    [password resignFirstResponder];
}

- (BOOL) textFieldShouldReturn:(UITextField *)textField{
    if(textField){
        [textField resignFirstResponder];
    }
    return NO;
}

- (void)viewWillAppear:(BOOL)animated{
    [self.navigationController setNavigationBarHidden:YES];
}


- (IBAction)loginBtn:(id)sender {
}
@end
