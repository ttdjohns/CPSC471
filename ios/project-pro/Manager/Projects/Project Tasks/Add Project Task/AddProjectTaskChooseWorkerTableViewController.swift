//
//  AddProjectTaskChooseWorkerTableViewController.swift
//  project-pro
//
//  Created by Anton Lysov on 2018-12-04.
//  Copyright © 2018 Anton Lysov. All rights reserved.
//

import UIKit

class AddProjectTaskChooseWorkerTableViewController: UITableViewController {
	
	var delegate: AddProjectTaskTableViewController!
	var selectedCell: IndexPath!
	
	//"Workers with Stregnths and Desires"
	var firstSectionCells = [WorkerForTask]()
	//"Workers with Stregnths"
	var secondSectionCells = [WorkerForTask]()
	//"Workers with Desires"
	var thirdSectionCells = [WorkerForTask]()
	// The Rest
	var fourthSectionCells = [WorkerForTask]()
	
	override func viewDidLoad() {
		super.viewDidLoad()
		
		self.tableView.tableFooterView = UIView()
		
		let url = URL(string: Endpoint.listWorkersForTask)!
		// create the session object
		let session = URLSession.shared
		// now create the URLRequest object using the url object
		var request = URLRequest(url: url)
		request.httpMethod = "POST" //set http method as POST
		do {
			var parameters: Parameters = [
				"id": Int(User.id!)!
			]
			parameters["Task_ID"] = delegate.selectedTaskID
			if let accessLevel = User.accessLevel, accessLevel != "2" {
				parameters["Team_ID"] = delegate.selectedTeamID
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
					if
						let status = json["status"] as? Bool,
						let firstSection = json["WorkersWithSandD"] as? [[String: Any]],
						let secondSection = json["WorkersWithSnoD"] as? [[String: Any]],
						let thirdSection = json["WorkersWithDnoS"] as? [[String: Any]],
						let fourthSection = json["WorkersWithNoSnoD"] as? [[String: Any]] {
						if status {
							DispatchQueue.main.async {
								self.firstSectionCells = [WorkerForTask]()
								// 1
								for worker in firstSection {
									if
										let id = worker["Worker_ID"] as? Int,
										let firstName = worker["First_name"] as? String,
										let lastName = worker["Last_name"] as? String,
										let type = worker["Worker_type"] as? String {
										self.firstSectionCells.append(WorkerForTask(id: id, firstName: firstName, lastName: lastName, type: type))
									}
								}
								// 2
								self.secondSectionCells = [WorkerForTask]()
								for worker in secondSection {
									if
										let id = worker["Worker_ID"] as? Int,
										let firstName = worker["First_name"] as? String,
										let lastName = worker["Last_name"] as? String,
										let type = worker["Worker_type"] as? String {
										self.secondSectionCells.append(WorkerForTask(id: id, firstName: firstName, lastName: lastName, type: type))
									}
								}
								// 3
								self.thirdSectionCells = [WorkerForTask]()
								for worker in thirdSection {
									if
										let id = worker["Worker_ID"] as? Int,
										let firstName = worker["First_name"] as? String,
										let lastName = worker["Last_name"] as? String,
										let type = worker["Worker_type"] as? String {
										self.thirdSectionCells.append(WorkerForTask(id: id, firstName: firstName, lastName: lastName, type: type))
									}
								}
								// 4
								self.fourthSectionCells = [WorkerForTask]()
								for worker in fourthSection {
									if
										let id = worker["Worker_ID"] as? Int,
										let firstName = worker["First_name"] as? String,
										let lastName = worker["Last_name"] as? String,
										let type = worker["Worker_type"] as? String {
										self.fourthSectionCells.append(WorkerForTask(id: id, firstName: firstName, lastName: lastName, type: type))
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

    // MARK: - Table view data source

    override func numberOfSections(in tableView: UITableView) -> Int {
        return 4
    }

    override func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
		switch section {
		case 0: return firstSectionCells.count
		case 1: return secondSectionCells.count
		case 2: return thirdSectionCells.count
		case 3: return fourthSectionCells.count
		default: fatalError("Invalid Section")
		}
    }
	
	override func tableView(_ tableView: UITableView, titleForHeaderInSection section: Int) -> String? {
		switch section {
		case 0: return "Workers with Strengths and Desires"
		case 1: return "Workers with Strengths"
		case 2: return "Workers with Desires"
		case 3: return "The Rest Workers"
		default: fatalError("Invalid Section")
		}
	}

	override func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
		let cell = tableView.dequeueReusableCell(withIdentifier: "cell") as! WorkerForTaskTableViewCell
		switch indexPath.section {
		case 0:
			cell.nameLabel.text = "\(firstSectionCells[indexPath.row].firstName) \(firstSectionCells[indexPath.row].lastName)"
			cell.typeLabel.text = firstSectionCells[indexPath.row].type
		case 1:
			cell.nameLabel.text = "\(secondSectionCells[indexPath.row].firstName) \(secondSectionCells[indexPath.row].lastName)"
			cell.typeLabel.text = secondSectionCells[indexPath.row].type
		case 2:
			cell.nameLabel.text = "\(thirdSectionCells[indexPath.row].firstName) \(thirdSectionCells[indexPath.row].lastName)"
			cell.typeLabel.text = thirdSectionCells[indexPath.row].type
		case 3:
			cell.nameLabel.text = "\(fourthSectionCells[indexPath.row].firstName) \(fourthSectionCells[indexPath.row].lastName)"
			cell.typeLabel.text = fourthSectionCells[indexPath.row].type
		default: fatalError("Invalid Section")
		}
		
		return cell
	}
	override func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
		switch indexPath.section {
		case 0:
			self.delegate.selectedWorkerID = firstSectionCells[indexPath.row].id
		case 1:
			self.delegate.selectedWorkerID = secondSectionCells[indexPath.row].id
		case 2:
			self.delegate.selectedWorkerID = thirdSectionCells[indexPath.row].id
		case 3:
			self.delegate.selectedWorkerID = fourthSectionCells[indexPath.row].id
		default: fatalError("Invalid Section")
		}
		self.navigationController?.popViewController(animated: true)
	}
}
