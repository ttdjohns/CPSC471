//
//  EditWorkerTableViewController.swift
//  project-pro
//
//  Created by Anton Lysov on 2018-12-05.
//  Copyright © 2018 Anton Lysov. All rights reserved.
//

import UIKit

class EditWorkerTableViewController: UITableViewController {
	
	@IBOutlet weak var firstNameLabel: UILabel!
	@IBOutlet weak var lastNameLabel: UILabel!
	@IBOutlet weak var typeLabel: UILabel!
	
	var delegate: TeamTableViewController!
	var worker: WorkerForTask!
	
	override func viewWillAppear(_ animated: Bool) {
		super.viewWillAppear(animated)
		firstNameLabel.text = worker.firstName
		lastNameLabel.text = worker.lastName
		typeLabel.text = worker.type
	}
	
	override func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
		if indexPath.section == 1 {
			let url = URL(string: Endpoint.removeWorkerFromTeam)!
			// create the session object
			let session = URLSession.shared
			// now create the URLRequest object using the url object
			var request = URLRequest(url: url)
			request.httpMethod = "POST" //set http method as POST
			do {
				var parameters: Parameters = [
					"id": Int(User.id!)!,
					"Worker_ID": self.worker.id
				]
				if let accessLevel = User.accessLevel, accessLevel != "2" {
					parameters["Team_ID"] =  self.delegate.team.id
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
								self.navigationController?.popViewController(animated: true)
							}
						} else {
							print("/removeWorkerFromTeam Error")
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
