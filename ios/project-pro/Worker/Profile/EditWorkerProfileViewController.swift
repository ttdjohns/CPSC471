//
//  EditWorkerProfileViewController.swift
//  project-pro
//
//  Created by Anton Lysov on 2018-12-02.
//  Copyright © 2018 Anton Lysov. All rights reserved.
//

import UIKit

class EditWorkerProfileViewController: UIViewController {
	
	@IBOutlet weak var firstNameTextField: UITextField!
	@IBOutlet weak var lastNameTextField: UITextField!
	@IBOutlet weak var emailTextField: UITextField!
	@IBOutlet weak var phoneTextField: UITextField!
	
	var initialFirstName: String!
	var initialLastName: String!
	
	override func viewWillAppear(_ animated: Bool) {
		self.firstNameTextField.text = "First Name"
		self.lastNameTextField.text = "Last Name"
		
		let url = URL(string: Endpoint.listWorkerDetails)!
		// create the session object
		let session = URLSession.shared
		// now create the URLRequest object using the url object
		var request = URLRequest(url: url)
		request.httpMethod = "POST" //set http method as POST
		do {
			let parameters: Parameters = [
				"id": Int(User.id!)!
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
					print(json)
					if
						let status = json["status"] as? Bool,
						let firstName = json["First_name"] as? String,
						let lastName = json["Last_name"] as? String,
						let emails = json["Emails"] as? [String],
						let phones = json["Phone_numbers"] as? [String] {
						if status {
							DispatchQueue.main.async {
								self.firstNameTextField.text = firstName
								self.initialFirstName = firstName
								self.lastNameTextField.text = lastName
								self.initialLastName = lastName
								if let email = emails.first {
									self.emailTextField.text = email
								}
								if let phone = phones.first {
									self.phoneTextField.text = phone
								}
							}
						} else {
							print("POST /listWorkerDetails Error")
						}
					}
				}
			} catch let error {
				print(error.localizedDescription)
			}
		})
		task.resume()
	}

	
	@IBAction func cancelButtonDidPress(_ sender: Any) {
		self.dismiss(animated: true, completion: nil)
	}
	
	@IBAction func doneButtonDidPress(_ sender: Any) {
		
		let url = URL(string: Endpoint.editWorker)!
		// create the session object
		let session = URLSession.shared
		// now create the URLRequest object using the url object
		var request = URLRequest(url: url)
		request.httpMethod = "POST" //set http method as POST
		do {
			var parameters: Parameters = [
				"id": Int(User.id!)!
			]
			if let firstName = self.firstNameTextField.text, firstName.count > 0 {
				parameters["First_name"] = firstName
			} else {
				parameters["First_name"] = initialFirstName
			}
			if let lastName = self.lastNameTextField.text, lastName.count > 0 {
				parameters["Last_name"] = lastName
			} else {
				parameters["Last_name"] = initialLastName
			}
			if let email = self.emailTextField.text, email.count > 0 {
				parameters["Emails"] = [email]
			} else {
				parameters["Emails"] = []
			}
			if let phone = self.phoneTextField.text, phone.count > 0 {
				parameters["Phone_numbers"] = [phone]
			} else {
				parameters["Phone_numbers"] = []
			}
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
					print(json)
					if let status = json["status"] as? Bool, status {
						DispatchQueue.main.async {
							self.dismiss(animated: true, completion: nil)
						}
					} else {
						DispatchQueue.main.async {
							let alert = UIAlertController(title: "Invalid Input", message: nil, preferredStyle: .alert)
							alert.addAction(UIAlertAction(title: "OK", style: .default, handler: nil))
							self.present(alert, animated: true, completion: nil)
						}
						print("POST /editWorker Error")
					}
				}
			} catch let error {
				print(error.localizedDescription)
			}
		})
		task.resume()
	}
}
