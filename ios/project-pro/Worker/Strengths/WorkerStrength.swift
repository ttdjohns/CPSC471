//
//  Strength.swift
//  project-pro
//
//  Created by Anton Lysov on 2018-12-02.
//  Copyright © 2018 Anton Lysov. All rights reserved.
//

import Foundation

struct WorkerStrength {
	let rank: Int!
	let id: Int
	let name: String
	let description: String
	
	init(rank: Int, id: Int, name: String, description: String) {
		self.rank = rank
		self.id = id
		self.name = name
		self.description = description
	}
	
	init(id: Int, name: String, description: String) {
		self.rank = nil
		self.id = id
		self.name = name
		self.description = description
	}
}
