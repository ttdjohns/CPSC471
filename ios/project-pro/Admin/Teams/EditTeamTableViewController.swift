//
//  EditTeamTableViewController.swift
//  project-pro
//
//  Created by Anton Lysov on 2018-12-03.
//  Copyright © 2018 Anton Lysov. All rights reserved.
//

import UIKit

class EditTeamTableViewController: UITableViewController {

	@IBOutlet weak var nameTextField: UITextField!
	@IBOutlet weak var supervisorIDTextField: UITextField!
	
	var delegate: TeamTableViewController!
	
	override func viewWillAppear(_ animated: Bool) {
		super.viewWillAppear(animated)
		
		nameTextField.text = "\(delegate.team.name)"
		supervisorIDTextField.text = "\(delegate.team.supervisorID)"
	}
	
	@IBAction func cancelButtonDidPress(_ sender: Any) {
		self.dismiss(animated: true, completion: nil)
	}
	@IBAction func doneButtonDidPress(_ sender: Any) {
		let url = URL(string: Endpoint.editTeam)!
		// create the session object
		let session = URLSession.shared
		// now create the URLRequest object using the url object
		var request = URLRequest(url: url)
		request.httpMethod = "POST" //set http method as POST
		do {
			var parameters: Parameters = [
				"id": Int(User.id!)!
			]
			parameters["Team_ID"] = delegate.team.id
			if let name = self.nameTextField.text {
				parameters["Team_name"] = name
			}
			if let supervisorID = self.supervisorIDTextField.text {
				parameters["Supervisor_ID"] = Int(supervisorID)!
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
						print("POST /editTeam Error")
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
			let url = URL(string: Endpoint.removeTeam)!
			// create the session object
			let session = URLSession.shared
			// now create the URLRequest object using the url object
			var request = URLRequest(url: url)
			request.httpMethod = "POST" //set http method as POST
			do {
				let parameters: Parameters = [
					"id": Int(User.id!)!,
					"Team_ID": self.delegate.team.id
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
							print("POST /removeTeam Error")
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
