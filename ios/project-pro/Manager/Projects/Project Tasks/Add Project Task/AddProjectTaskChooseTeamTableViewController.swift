
//
//  AddProjectTaskChooseTeamTableViewController.swift
//  project-pro
//
//  Created by Anton Lysov on 2018-12-04.
//  Copyright © 2018 Anton Lysov. All rights reserved.
//

import UIKit

class AddProjectTaskChooseTeamTableViewController: UITableViewController {
	
	var delegate: AddProjectTaskTableViewController!
	var cells = [Team]()
	var selectedCell: IndexPath!
	
	override func viewDidLoad() {
		super.viewDidLoad()
		
		self.tableView.tableFooterView = UIView()
		
		let url = URL(string: Endpoint.listTeamsWorkingOnProject)!
		// create the session object
		let session = URLSession.shared
		// now create the URLRequest object using the url object
		var request = URLRequest(url: url)
		request.httpMethod = "POST" //set http method as POST
		do {
			let parameters: Parameters = [
				"id": Int(User.id!)!,
				"Project_ID": self.delegate.project.id
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
						let teams = json["Teams"] as? [[String: Any]] {
						if status {
							DispatchQueue.main.async {
								self.cells = [Team]()
								for team in teams {
									if
										let id = team["Team_ID"] as? Int,
										let name = team["Team_name"] as? String,
										let supervisorID = team["Supervisor_ID"] as? Int {
										let team = Team(id: id, supervisorID: supervisorID, name: name)
										self.cells.append(team)
									}
								}
								self.tableView.reloadData()
							}
						} else {
							print("POST /listTasks Error")
						}
					}
				}
			} catch let error {
				print(error.localizedDescription)
			}
		})
		task.resume()
	}
	
	override func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
		return self.cells.count
	}
	override func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
		let cell = tableView.dequeueReusableCell(withIdentifier: "cell") as! UITableViewCell
		cell.textLabel?.text = "\(cells[indexPath.row].name)"
		
		return cell
	}
	override func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
		self.delegate.selectedTeamID = indexPath.row + 1
		self.navigationController?.popViewController(animated: true)
	}

}
