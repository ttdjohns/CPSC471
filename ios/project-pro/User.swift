//
//  User.swift
//  project-pro
//
//  Created by Anton Lysov on 2018-12-02.
//  Copyright © 2018 Anton Lysov. All rights reserved.
//

import Foundation
import UIKit

struct User {
	
	static var id: String? {
		return UserDefaults.standard.string(forKey: "id") ?? nil
	}
	
	static var accessLevel: String? {
		return UserDefaults.standard.string(forKey: "access_level") ?? nil
	}
	
	// 1 - worker, 2 - manager, 3 - admin
	static var authorization: Authorization {
		guard
			let accessLevel = UserDefaults.standard.string(forKey: "access_level"),
			let authorization = Authorization(rawValue: accessLevel) else {
			return .unauthorized
		}
		return authorization
	}
	
	static func login(id: Int, accessLevel: Int) {
		UserDefaults.standard.set(id, forKey: "id")
		UserDefaults.standard.set(accessLevel, forKey: "access_level")
		let appDelegate = UIApplication.shared.delegate as! AppDelegate
		switch User.authorization {
		case .worker:
			appDelegate.presentWorkerTabBarController()
		case .manager:
			appDelegate.presentManagerTabBarController()
		case .admin:
			appDelegate.presentAdminTabBarController()
		default:
			fatalError()
		}
	}
	
	static func logout() {
		UserDefaults.standard.set(nil, forKey: "id")
		UserDefaults.standard.set(nil, forKey: "access_level")
		let appDelegate = UIApplication.shared.delegate as! AppDelegate
		appDelegate.presentAuthTabBarController()
	}
}
