//
//  AdminTask.swift
//  project-pro
//
//  Created by Anton Lysov on 2018-12-04.
//  Copyright © 2018 Anton Lysov. All rights reserved.
//

import Foundation

struct AdminTask {
	let id: Int
	let name: String
	let description: String
	var strengths = [AssociatedStrength]()
	
	init(id: Int, name: String, description: String) {
		self.id = id
		self.name = name
		self.description = description
	}
}

struct AssociatedStrength {
	let id: Int
	let name: String
	let description: String
}
