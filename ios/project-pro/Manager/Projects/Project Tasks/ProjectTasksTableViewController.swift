//
//  ProjectTasksTableViewController.swift
//  project-pro
//
//  Created by Anton Lysov on 2018-12-04.
//  Copyright © 2018 Anton Lysov. All rights reserved.
//

import UIKit

class ProjectTasksTableViewController: UITableViewController {
	
	var project: Project!
	var cells = [ProjectTask]()
	
	override func viewDidLoad() {
		super.viewDidLoad()
		let editButton = UIBarButtonItem(barButtonSystemItem: .edit, target: self, action: #selector(editProjectButtonDidPress))
		let addButton = UIBarButtonItem(barButtonSystemItem: .add, target: self, action: #selector(addProjectTaskButtonDidPress))
		navigationItem.rightBarButtonItems = [addButton, editButton]
		self.tableView.tableFooterView = UIView()
	}
	
	override func viewWillAppear(_ animated: Bool) {
		super.viewWillAppear(animated)
		
		let url = URL(string: Endpoint.listProjectTasks)!
		// create the session object
		let session = URLSession.shared
		// now create the URLRequest object using the url object
		var request = URLRequest(url: url)
		request.httpMethod = "POST" //set http method as POST
		do {
			let parameters: Parameters = [
				"id": Int(User.id!)!,
				"Project_ID": self.project.id
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
						let projectTasks = json["Project_tasks"] as? [[String: Any]] {
						if status {
							DispatchQueue.main.async {
								self.cells = [ProjectTask]()
								for projectTask in projectTasks {
									if
										let workerID = projectTask["Worker_ID"] as? Int,
										let workerFirstName = projectTask["Worker_first_name"] as? String,
										let workerLastName = projectTask["Worker_last_name"] as? String,
										let projectID = projectTask["Project_ID"] as? Int,
										let projectName = projectTask["Project_name"] as? String,
										let projectDescription = projectTask["Project_description"] as? String,
										let taskID = projectTask["Task_ID"] as? Int,
										let taskName = projectTask["Task_name"] as? String,
										let taskDescription = projectTask["Task_description"] as? String,
										let teamID = projectTask["Team_ID"] as? Int,
										let teamName = projectTask["Team_name"] as? String {
										let projectTask = ProjectTask(workerID: workerID,
																	  workerFirstName: workerFirstName,
																	  workerLastName: workerLastName,
																	  projectID: projectID,
																	  projectName: projectName,
																	  projectDescription: projectDescription,
																	  taskID: taskID,
																	  taskName: taskName,
																	  taskDescription: taskDescription,
																	  teamID: teamID,
																	  teamName: teamName)
										self.cells.append(projectTask)
									}
								}
								self.tableView.reloadData()
							}
						} else {
							print("/listProjectTasks Error")
						}
					}
				}
			} catch let error {
				print(error.localizedDescription)
			}
		})
		task.resume()
	}
	
	@objc func addProjectTaskButtonDidPress() {
		let storyboard = UIStoryboard(name: "Manager", bundle: nil)
		
		let newNavigationController = storyboard.instantiateViewController(withIdentifier: "AddProjectTaskNavigationController")
		guard let vc = newNavigationController.children.first as? AddProjectTaskTableViewController else { fatalError() }
		vc.project = self.project
		self.present(newNavigationController, animated: true, completion: nil)
	}
	
	@objc func editProjectButtonDidPress() {
		self.tableView.isEditing = true
	}
	
	override func tableView(_ tableView: UITableView, commit editingStyle: UITableViewCell.EditingStyle, forRowAt indexPath: IndexPath) {
		tableView.isEditing = false
		if editingStyle == .delete {
			let cell = cells[indexPath.row]
			let url = URL(string: Endpoint.removeProjectTask)!
			// create the session object
			let session = URLSession.shared
			// now create the URLRequest object using the url object
			var request = URLRequest(url: url)
			request.httpMethod = "POST" //set http method as POST
			do {
				let parameters: Parameters = [
					"id": Int(User.id!)!,
					"Project_ID": cell.projectID,
					"Worker_ID": cell.workerID,
					"Task_ID": cell.taskID,
					"Team_ID": cell.teamID
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
							let status = json["status"] as? Bool{
							if status {
								DispatchQueue.main.async {
									self.cells.remove(at: indexPath.row)
									self.tableView.reloadData()
								}
							} else {
								print("/listProjectTasks Error")
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
	
	override func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
		return self.cells.count
	}
	override func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
		
		let cell = tableView.dequeueReusableCell(withIdentifier: "cell") as! ProjectTaskTableViewCell
		
		cell.taskNameLabel.text = cells[indexPath.row].taskName
		cell.taskDescriptionLabel.text = cells[indexPath.row].taskDescription
		cell.workerNameLabel.text = "\(cells[indexPath.row].workerFirstName) \(cells[indexPath.row].workerLastName)"
		cell.teamNameLabel.text = cells[indexPath.row].teamName
		
		return cell
	}
	
}
