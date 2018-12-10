//
//  TextFieldCell.swift
//  project-pro
//
//  Created by Anton Lysov on 2018-12-03.
//  Copyright © 2018 Anton Lysov. All rights reserved.
//

import UIKit

class TextFieldCell: UITableViewCell {
	
	@IBOutlet var textField: UITextField!
	
	override func awakeFromNib() {
		super.awakeFromNib()
		let gesture = UITapGestureRecognizer(target: self, action: #selector(TextFieldCell.didSelectCell))
		addGestureRecognizer(gesture)
	}
	
	@objc func didSelectCell() {
		self.textField.becomeFirstResponder()
	}
}
