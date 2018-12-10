//
//  Donation.swift
//  project-pro
//
//  Created by Anton Lysov on 2018-12-03.
//  Copyright © 2018 Anton Lysov. All rights reserved.
//

import Foundation

struct Donation {
	let id: Int
	let amount: Int
	let donorID: Int
	let causeID: Int
	let causeName: String
	let causeDescription: String
	// Donor Info
	let firstName: String
	let lastName: String
	let mailingAddress: String
}
