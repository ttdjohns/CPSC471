//
//  AppDelegate.swift
//  project-pro
//
//  Created by Anton Lysov on 2018-12-01.
//  Copyright © 2018 Anton Lysov. All rights reserved.
//

import UIKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

	var window: UIWindow?

	func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
		
		print("id: ", User.id)
		print("access_level: ", User.accessLevel)
		
		switch User.authorization {
		case .unauthorized:
			presentAuthTabBarController()
		case .worker:
			presentWorkerTabBarController()
		case .manager:
			presentManagerTabBarController()
		case .admin:
			presentAdminTabBarController()
		}
		
		return true
	}
	func presentAuthTabBarController() {
		self.window = UIWindow(frame: UIScreen.main.bounds)
		let mainStoryboard: UIStoryboard = UIStoryboard(name: "Auth", bundle: nil)
		let tabBarController = mainStoryboard.instantiateInitialViewController()
		if let window = self.window {
			window.rootViewController = tabBarController
			window.makeKeyAndVisible()
		}
	}
	func presentWorkerTabBarController() {
		self.window = UIWindow(frame: UIScreen.main.bounds)
		let mainStoryboard: UIStoryboard = UIStoryboard(name: "Worker", bundle: nil)
		let tabBarController = mainStoryboard.instantiateInitialViewController()
		if let window = self.window {
			window.rootViewController = tabBarController
			window.makeKeyAndVisible()
		}
	}
	func presentManagerTabBarController() {
		self.window = UIWindow(frame: UIScreen.main.bounds)
		let mainStoryboard: UIStoryboard = UIStoryboard(name: "Manager", bundle: nil)
		let tabBarController = mainStoryboard.instantiateInitialViewController()
		if let window = self.window {
			window.rootViewController = tabBarController
			window.makeKeyAndVisible()
		}
	}
	func presentAdminTabBarController() {
		self.window = UIWindow(frame: UIScreen.main.bounds)
		let mainStoryboard: UIStoryboard = UIStoryboard(name: "Admin", bundle: nil)
		let tabBarController = mainStoryboard.instantiateInitialViewController()
		if let window = self.window {
			window.rootViewController = tabBarController
			window.makeKeyAndVisible()
		}
	}

}

