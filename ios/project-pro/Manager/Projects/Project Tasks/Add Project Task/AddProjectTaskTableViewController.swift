//
//  AddTableViewController.swift
//  project-pro
//
//  Created by Anton Lysov on 2018-12-04.
//  Copyright © 2018 Anton Lysov. All rights reserved.
//

import UIKit

class AddProjectTaskTableViewController: UITableViewController {
	
	@IBOutlet weak var taskLabel: UILabel!
	@IBOutlet weak var teamLabel: UILabel!
	@IBOutlet weak var workerLabel: UILabel!
	
	var project: Project!
	
	var selectedTaskID: Int!
	var selectedTeamID: Int!
	var selectedWorkerID: Int!
	
	@IBAction func cancelButtonDidPress(_ sender: Any) {
		self.dismiss(animated: true, completion: nil)
	}
	@IBAction func doneButtonDidPress(_ sender: Any) {
		let url = URL(string: Endpoint.addProjectTask)!
		// create the session object
		let session = URLSession.shared
		// now create the URLRequest object using the url object
		var request = URLRequest(url: url)
		request.httpMethod = "POST" //set http method as POST
		do {
			let parameters: Parameters = [
				"id": Int(User.id!)!,
				"Task_ID": selectedTaskID,
				"Worker_ID": selectedWorkerID,
				"Project_ID": project.id,
				"Team_ID": selectedTeamID
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
	
	override func viewWillAppear(_ animated: Bool) {
		super.viewWillAppear(animated)
		if selectedTaskID != nil {
			taskLabel.text = "Chosen"
		} else {
			taskLabel.text = "Not Chosen"
		}
		if selectedTeamID != nil {
			teamLabel.text = "Chosen"
		} else {
			teamLabel.text = "Not Chosen"
		}
		if selectedWorkerID != nil {
			workerLabel.text = "Chosen"
		} else {
			workerLabel.text = "Not Chosen"
		}
	}
	
	override func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
		switch indexPath.row {
		case 0:
			let storyboard = UIStoryboard(name: "Manager", bundle: nil)
			guard let vc = storyboard.instantiateViewController(withIdentifier: "AddProjectTaskChooseTeamTableViewController") as? AddProjectTaskChooseTeamTableViewController else { fatalError() }
			self.show(vc, sender: nil)
			vc.delegate = self
		case 1:
			guard self.selectedTeamID != nil else {
				let alert = UIAlertController(title: "Please choose the the team first", message: nil, preferredStyle: .alert)
				alert.addAction(UIAlertAction(title: "OK", style: .default, handler: nil))
				self.tableView.deselectRow(at: indexPath, animated: true)
				self.present(alert, animated: true, completion: nil)
				return
			}
			let storyboard = UIStoryboard(name: "Manager", bundle: nil)
			guard let vc = storyboard.instantiateViewController(withIdentifier: "AddProjectTaskChooseTaskTableViewController") as? AddProjectTaskChooseTaskTableViewController else { fatalError() }
			vc.delegate = self
			self.show(vc, sender: nil)
		case 2:
			guard self.selectedTaskID != nil else {
				let alert = UIAlertController(title: "Please choose the task and the team first", message: nil, preferredStyle: .alert)
				alert.addAction(UIAlertAction(title: "OK", style: .default, handler: nil))
				self.tableView.deselectRow(at: indexPath, animated: true)
				self.present(alert, animated: true, completion: nil)
				return
			}
			let storyboard = UIStoryboard(name: "Manager", bundle: nil)
			guard let vc = storyboard.instantiateViewController(withIdentifier: "AddProjectTaskChooseWorkerTableViewController") as? AddProjectTaskChooseWorkerTableViewController else { fatalError() }
			vc.delegate = self
			self.show(vc, sender: nil)
		default: fatalError("Invalid indexPath.")
		}
	}

}
