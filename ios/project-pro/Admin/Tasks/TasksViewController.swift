//
//  TasksViewController.swift
//  project-pro
//
//  Created by Anton Lysov on 2018-12-03.
//  Copyright © 2018 Anton Lysov. All rights reserved.
//

import UIKit

class TasksViewController: UIViewController {

	@IBOutlet weak var tableView: UITableView!
	var cells = [AdminTask]()
	
	override func viewDidLoad() {
		super.viewDidLoad()
		
		navigationItem.rightBarButtonItem = UIBarButtonItem(barButtonSystemItem: .add, target: self, action: #selector(addTaskButtonDidPress))
		self.tableView.tableFooterView = UIView()
		
	}
	
	override func viewWillAppear(_ animated: Bool) {
		super.viewWillAppear(animated)
		
		let url = URL(string: Endpoint.listTasks)!
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
						let tasks = json["Tasks"] as? [[String: Any]] {
						if status {
							DispatchQueue.main.async {
								self.cells = [AdminTask]()
								for task in tasks {
									if
										let id = task["Task_ID"] as? Int,
										let name = task["Task_name"] as? String,
										let description = task["Task_description"] as? String,
										let strengths = task["Associated_strengths"] as? [[String: Any]] {
										var task = AdminTask(id: id, name: name, description: description)
										
										for strength in strengths {
											if let strengthID = strength["Strength_ID"] as? Int,
												let strengthName = strength["Strength_name"] as? String,
												let strengthDescription = strength["Strength_description"] as? String {
												task.strengths.append(AssociatedStrength(id: strengthID, name: strengthName, description: strengthDescription))
											}
										}
										self.cells.append(task)
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
	
	@objc func addTaskButtonDidPress() {
		let storyboard = UIStoryboard(name: "Admin", bundle: nil)
		let vc = storyboard.instantiateViewController(withIdentifier: "AddTaskNavigationController")
		self.show(vc, sender: nil)
	}

}

extension TasksViewController: UITableViewDataSource, UITableViewDelegate {
	
	func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
		return self.cells.count
	}
	func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
		let cell = tableView.dequeueReusableCell(withIdentifier: "cell") as! StrengthTableViewCell
		cell.nameLabel.text = "\(cells[indexPath.row].name)"
		cell.descriptionLabel.text = "\(cells[indexPath.row].description)"
		
		return cell
	}
	
	func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
		let storyboard = UIStoryboard(name: "Admin", bundle: nil)
		let newNavigationController = storyboard.instantiateViewController(withIdentifier: "EditTaskNavigationController")
		guard let vc = newNavigationController.children.first as? EditTaskTableViewController else { fatalError() }
		vc.task = self.cells[indexPath.row]
		self.present(newNavigationController, animated: true, completion: nil)
	}
}
