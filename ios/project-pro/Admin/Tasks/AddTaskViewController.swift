//
//  AddTaskViewController.swift
//  project-pro
//
//  Created by Anton Lysov on 2018-12-03.
//  Copyright © 2018 Anton Lysov. All rights reserved.
//

import UIKit

class AddTaskTableViewController: UITableViewController {

	@IBOutlet weak var nameTextField: UITextField!
	@IBOutlet weak var descriptionTextField: UITextField!
	
	@IBAction func cancelButtonDidPress(_ sender: Any) {
		self.dismiss(animated: true, completion: nil)
	}
	@IBAction func doneButtonDidPress(_ sender: Any) {
		let url = URL(string: Endpoint.addTask)!
		// create the session object
		let session = URLSession.shared
		// now create the URLRequest object using the url object
		var request = URLRequest(url: url)
		request.httpMethod = "POST" //set http method as POST
		do {
			var parameters: Parameters = [
				"id": Int(User.id!)!
			]
			if let name = self.nameTextField.text {
				parameters["Task_name"] = name
			}
			if let description = self.descriptionTextField.text {
				parameters["Task_description"] = description
			}
			parameters["Associated_strength_ID"] = [1]
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
