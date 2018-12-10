//
//  Cause.swift
//  project-pro
//
//  Created by Anton Lysov on 2018-12-03.
//  Copyright © 2018 Anton Lysov. All rights reserved.
//

import Foundation

struct Cause {
	let id: Int
	let name: String
	let description: String
	// stays the same
	var projects = [Int]()
	
	init(id: Int, name: String, description: String) {
		self.id = id
		self.name = name
		self.description = description
	}
}
