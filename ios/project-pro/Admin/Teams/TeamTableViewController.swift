//
//  TeamTableViewController.swift
//  project-pro
//
//  Created by Anton Lysov on 2018-12-04.
//  Copyright © 2018 Anton Lysov. All rights reserved.
//

import UIKit

class TeamTableViewController: UITableViewController {
	
	var workerCells = [WorkerForTask]()
	var projectCells = [Project]()
	
	var team: Team!

    override func viewDidLoad() {
        super.viewDidLoad()
		
		if let accessLevel = User.accessLevel, accessLevel != "2" {
			self.navigationItem.title = "\(team.name) Team"
		} else {
			self.navigationItem.title = "Team"
		}
		navigationItem.rightBarButtonItem = UIBarButtonItem(barButtonSystemItem: .edit, target: self, action: #selector(editTeamButtonDidPress))
		tableView.tableFooterView = UIView()
    }
	
	override func viewWillAppear(_ animated: Bool) {
		super.viewWillAppear(animated)
		
		// Workers
		var url = URL(string: Endpoint.listTeamWorkers)!
		// create the session object
		var session = URLSession.shared
		// now create the URLRequest object using the url object
		var request = URLRequest(url: url)
		request.httpMethod = "POST" //set http method as POST
		do {
			var parameters: Parameters = [
				"id": Int(User.id!)!
			]
			if let accessLevel = User.accessLevel, accessLevel != "2" {
				parameters["Team_ID"] = team.id
			}
			request.httpBody = try JSONSerialization.data(withJSONObject: parameters, options: .prettyPrinted) // pass dictionary to nsdata object and set it as request body
		} catch let error {
			print(error.localizedDescription)
		}
		request.addValue("application/json", forHTTPHeaderField: "Content-Type")
		request.addValue("application/json", forHTTPHeaderField: "Accept")
		
		// create dataTask using the session object to send data to the server
		var task = session.dataTask(with: request as URLRequest, completionHandler: { data, response, error in
			guard error == nil else { return }
			guard let data = data else { return }
			do {
				if let json = try JSONSerialization.jsonObject(with: data, options: .mutableContainers) as? [String: Any] {
					print(json)
					if
						let status = json["status"] as? Bool,
						let workers = json["Workers"] as? [[String: Any]] {
						if status {
							DispatchQueue.main.async {
								self.workerCells = [WorkerForTask]()
								for worker in workers {
									if
										let id = worker["Worker_ID"] as? Int,
										let firstName = worker["First_name"] as? String,
										let lastName = worker["Last_name"] as? String,
										let type = worker["Worker_type"] as? String {
										self.workerCells.append(WorkerForTask(id: id, firstName: firstName, lastName: lastName, type: type))
									}
								}
								self.tableView.reloadData()
							}
						} else {
							print("/listCauses Error")
						}
					}
				}
			} catch let error {
				print(error.localizedDescription)
			}
		})
		task.resume()
		
		// Projects
		url = URL(string: Endpoint.listProjects)!
		// create the session object
		session = URLSession.shared
		// now create the URLRequest object using the url object
		request = URLRequest(url: url)
		request.httpMethod = "POST" //set http method as POST
		do {
			var parameters: Parameters = [
				"id": Int(User.id!)!
			]
			if let accessLevel = User.accessLevel, accessLevel != "2" {
				parameters["Team_ID"] = team.id
			}
			request.httpBody = try JSONSerialization.data(withJSONObject: parameters, options: .prettyPrinted) // pass dictionary to nsdata object and set it as request body
		} catch let error {
			print(error.localizedDescription)
		}
		request.addValue("application/json", forHTTPHeaderField: "Content-Type")
		request.addValue("application/json", forHTTPHeaderField: "Accept")
		
		// create dataTask using the session object to send data to the server
		task = session.dataTask(with: request as URLRequest, completionHandler: { data, response, error in
			guard error == nil else { return }
			guard let data = data else { return }
			do {
				if let json = try JSONSerialization.jsonObject(with: data, options: .mutableContainers) as? [String: Any] {
					print(json)
					if
						let status = json["status"] as? Bool,
						let tasks = json["Projects"] as? [[String: Any]] {
						if status {
							DispatchQueue.main.async {
								self.projectCells = [Project]()
								for task in tasks {
									if
										let id = task["Project_ID"] as? Int,
										let name = task["Project_name"] as? String,
										let description = task["Project_description"] as? String {
										var project = Project(id: id, name: name, description: description)
										self.projectCells.append(project)
									}
								}
								self.tableView.reloadData()
							}
						} else {
							print("/listStrengths Error")
						}
					}
				}
			} catch let error {
				print(error.localizedDescription)
			}
		})
		task.resume()
	}
	
	@objc func editTeamButtonDidPress() {
		let storyboard = UIStoryboard(name: "Admin", bundle: nil)
		let newNavigationController = storyboard.instantiateViewController(withIdentifier: "EditTeamNavigationController")
		guard let vc = newNavigationController.children.first as? EditTeamTableViewController else { fatalError() }
		vc.delegate = self
		self.present(newNavigationController, animated: true, completion: nil)
	}

    // MARK: - Table view data source

    override func numberOfSections(in tableView: UITableView) -> Int {
        // #warning Incomplete implementation, return the number of sections
        return 2
    }
	
	override func tableView(_ tableView: UITableView, titleForHeaderInSection section: Int) -> String? {
		switch section {
		case 0:
			return "Workers"
		case 1:
			return "Projects"
		default:
			fatalError()
		}
	}

    override func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
		switch section {
		case 0:
			return workerCells.count
		case 1:
			return projectCells.count
		default:
			fatalError()
		}
    }
	
    override func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let cell = tableView.dequeueReusableCell(withIdentifier: "cell", for: indexPath)

		switch indexPath.section {
		case 0:
			cell.textLabel?.text = "\(workerCells[indexPath.row].firstName) \(workerCells[indexPath.row].lastName)"
		case 1:
			cell.textLabel?.text = projectCells[indexPath.row].name
		default:
			fatalError()
		}

        return cell
    }
	
	override func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
		switch indexPath.section {
		case 0:
			let storyboard = UIStoryboard(name: "Admin", bundle: nil)
			guard let vc = storyboard.instantiateViewController(withIdentifier: "EditWorkerTableViewController") as? EditWorkerTableViewController else { fatalError() }
			vc.delegate = self
			vc.worker = workerCells[indexPath.row]
			self.navigationController?.pushViewController(vc, animated: true)
		case 1:
			let storyboard = UIStoryboard(name: "Manager", bundle: nil)
			guard let vc = storyboard.instantiateViewController(withIdentifier: "ProjectTableViewController") as? ProjectTableViewController else { fatalError() }
			vc.project = projectCells[indexPath.row]
			vc.title = "\(projectCells[indexPath.row].name) Project"
			self.navigationController?.pushViewController(vc, animated: true)
		default:
			fatalError()
		}
	}

}
