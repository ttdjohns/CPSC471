//
//  Donor.swift
//  project-pro
//
//  Created by Anton Lysov on 2018-12-02.
//  Copyright © 2018 Anton Lysov. All rights reserved.
//

import Foundation

struct Donor {
	let id: Int
	let firstName: String
	let lastName: String
	let mailingAddress: String
	let email: String?
	let phone: String?
	
	init(id: Int, firstName: String, lastName: String, mailingAddress: String, email: String? = nil, phone: String? = nil) {
		self.id = id
		self.firstName = firstName
		self.lastName = lastName
		self.mailingAddress = mailingAddress
		self.email = email
		self.phone = phone
	}
}
