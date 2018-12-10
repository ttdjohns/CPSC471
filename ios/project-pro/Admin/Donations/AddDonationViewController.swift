//
//  AddDonationViewController.swift
//  project-pro
//
//  Created by Anton Lysov on 2018-12-03.
//  Copyright © 2018 Anton Lysov. All rights reserved.
//

import UIKit

class AddDonationTableViewController: UITableViewController {

	@IBOutlet weak var amountTextField: UITextField!
	@IBOutlet weak var causeTextField: UITextField!
	@IBOutlet weak var donorTextField: UITextField!
	
	@IBAction func cancelButtonDidPress(_ sender: Any) {
		self.dismiss(animated: true, completion: nil)
	}
	@IBAction func doneButtonDidPress(_ sender: Any) {
		let url = URL(string: Endpoint.addDonation)!
		// create the session object
		let session = URLSession.shared
		// now create the URLRequest object using the url object
		var request = URLRequest(url: url)
		request.httpMethod = "POST" //set http method as POST
		do {
			var parameters: Parameters = [
				"id": Int(User.id!)!
			]
			if let amount = self.amountTextField.text {
				parameters["Amount"] = Int(amount)!
			}
			if let donorID = self.donorTextField.text {
				parameters["Donor_ID"] = Int(donorID)!
			}
			if let causeID = self.causeTextField.text {
				parameters["Cause_ID"] = Int(causeID)!
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
