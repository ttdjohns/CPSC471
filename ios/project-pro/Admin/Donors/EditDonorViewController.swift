//
//  EditDonortableViewController.swift
//  project-pro
//
//  Created by Anton Lysov on 2018-12-03.
//  Copyright © 2018 Anton Lysov. All rights reserved.
//

import UIKit

class EditDonorTableViewController: UITableViewController {

	@IBOutlet weak var firstNameTextField: UITextField!
	@IBOutlet weak var lastNameTextField: UITextField!
	@IBOutlet weak var mailingAddressTextField: UITextField!
	@IBOutlet weak var emailTextField: UITextField!
	@IBOutlet weak var phoneTextField: UITextField!
	
	var donor: Donor!
	
	override func viewWillAppear(_ animated: Bool) {
		super.viewWillAppear(animated)
		
		firstNameTextField.text = donor.firstName
		lastNameTextField.text = donor.lastName
		mailingAddressTextField.text = donor.lastName
		emailTextField.text = donor.email
		phoneTextField.text = donor.phone
	}
	
	@IBAction func cancelButtonDidPress(_ sender: Any) {
		self.dismiss(animated: true, completion: nil)
	}
	@IBAction func doneButtonDidPress(_ sender: Any) {
		
		let url = URL(string: Endpoint.editDonor)!
		// create the session object
		let session = URLSession.shared
		// now create the URLRequest object using the url object
		var request = URLRequest(url: url)
		request.httpMethod = "POST" //set http method as POST
		do {
			var parameters: Parameters = [
				"id": Int(User.id!)!,
				"Donor_ID": donor.id
			]
			if let firstName = self.firstNameTextField.text {
				parameters["First_name"] = firstName
			}
			if let lastName = self.lastNameTextField.text {
				parameters["Last_name"] = lastName
			}
			if let email = self.emailTextField.text {
				parameters["Emails"] = [email]
			} else {
				parameters["Emails"] = []
			}
			if let mailingAddress = self.mailingAddressTextField.text {
				parameters["Mailing_address"] = mailingAddress
			}
			if let email = self.emailTextField.text {
				parameters["Emails"] = [email]
			} else {
				parameters["Emails"] = []
			}
			if let phone = self.phoneTextField.text {
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
	
	override func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
		if indexPath.section == 1 {
			let url = URL(string: Endpoint.removeDonor)!
			// create the session object
			let session = URLSession.shared
			// now create the URLRequest object using the url object
			var request = URLRequest(url: url)
			request.httpMethod = "POST" //set http method as POST
			do {
				let parameters: Parameters = [
					"id": Int(User.id!)!,
					"Donor_ID": donor.id
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
							print("POST /removeDonor Error")
						}
					}
				} catch let error {
					print(error.localizedDescription)
				}
			})
			task.resume()
		}
	}

}
