//
//  WorkerProfileViewController.swift
//  project-pro
//
//  Created by Anton Lysov on 2018-12-02.
//  Copyright © 2018 Anton Lysov. All rights reserved.
//

import UIKit

class WorkerProfileViewController: UITableViewController {
	
	@IBOutlet weak var firstNameLabel: UILabel!
	@IBOutlet weak var lastNameLabel: UILabel!
	@IBOutlet weak var emailLabel: UILabel!
	@IBOutlet weak var phoneLabel: UILabel!
	
	var firstName: String! {
		didSet {
			self.firstNameLabel.text = firstName
		}
	}
	var lastName: String! {
		didSet {
			self.lastNameLabel.text = lastName
		}
	}
	var email: String! {
		didSet {
			self.emailLabel.text = email
		}
	}
	var phone: String! {
		didSet {
			self.phoneLabel.text = phone
		}
	}
	
	override func viewWillAppear(_ animated: Bool) {
		super.viewWillAppear(animated)
		
		self.firstName = "First Name"
		self.lastName = "Last Name"
		self.email = "N/A"
		self.phone = "N/A"
		
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
								self.firstName = firstName
								self.lastName = lastName
								if let email = emails.first {
									self.email = email
								}
								if let phone = phones.first {
									self.phone = phone
								}
								self.tableView.reloadData()
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
	
	override func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
		if indexPath.section == 1 {
			User.logout()
		}
	}
}
