//
//  AccessLevel.swift
//  project-pro
//
//  Created by Anton Lysov on 2018-12-02.
//  Copyright © 2018 Anton Lysov. All rights reserved.
//

import Foundation

enum Authorization: String {
	case unauthorized = "0"
	case worker = "1"
	case manager = "2"
	case admin = "3"
}
