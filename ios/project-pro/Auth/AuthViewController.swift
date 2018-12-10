//
//  ViewController.swift
//  project-pro
//
//  Created by Anton Lysov on 2018-12-01.
//  Copyright © 2018 Anton Lysov. All rights reserved.
//

import UIKit

class AuthViewController: UIViewController {

	@IBOutlet weak var emailTextField: UITextField!
	@IBOutlet weak var passwordTextField: UITextField!

	@IBAction func logInButtonDidPress(_ sender: Any) {
		//guard let email = emailTextField.text, let password = passwordTextField.text else { return }
		
		//Worker id: 6
//		let email = "Chris P."
//		let password = "Bacon"
		//Manager id: 4
//		let email = "antonL"
//		let password = "ForTheMotherLand"
		//Admin id: 1
		let email = "admin"
		let password = "admin"
		
		let url = URL(string: Endpoint.login)!
		// create the session object
		let session = URLSession.shared
		// now create the URLRequest object using the url object
		var request = URLRequest(url: url)
		request.httpMethod = "POST" //set http method as POST
		do {
			let parameters: Parameters = [
				"Username": email,
				"Password": password
			]
			request.httpBody = try JSONSerialization.data(withJSONObject: parameters, options: .prettyPrinted) // pass dictionary to nsdata object and set it as request body
		} catch let error {
			print(error.localizedDescription)
		}
		request.addValue("application/json", forHTTPHeaderField: "Content-Type")
		request.addValue("application/json", forHTTPHeaderField: "Accept")
		
		// create dataTask using the session object to send data to the server
		let task = session.dataTask(with: request as URLRequest, completionHandler: { data, response, error in
			guard error == nil else { return }
			guard let data = data else { return }
			do {
				if let json = try JSONSerialization.jsonObject(with: data, options: .mutableContainers) as? [String: Any] {
					if
						let status = json["status"] as? Int,
						let accessLevel = json["Access_level"] as? Int,
						let id = json["id"] as? Int {
						if status == 1 {
							DispatchQueue.main.async {
								User.login(id: id, accessLevel: accessLevel)
							}
						} else {
							print("POST /login Error")
						}
					}
				}
			} catch let error {
				print(error.localizedDescription)
			}
		})
		task.resume()
	}
	
}

