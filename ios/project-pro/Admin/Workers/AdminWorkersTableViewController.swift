//
//  ManagerWorkersTableViewController.swift
//  project-pro
//
//  Created by Anton Lysov on 2018-12-05.
//  Copyright © 2018 Anton Lysov. All rights reserved.
//

import UIKit

class AdminWorkersTableViewController: UITableViewController {
	
	var workerCells = [AdminWorker]()
	
	var team: Team!
	
	override func viewDidLoad() {
		super.viewDidLoad()
		navigationItem.rightBarButtonItem = UIBarButtonItem(barButtonSystemItem: .add, target: self, action: #selector(addWorkerButtonDidPress))
		tableView.tableFooterView = UIView()
	}
	
	@objc func addWorkerButtonDidPress() {}

	override func viewWillAppear(_ animated: Bool) {
		super.viewWillAppear(animated)
		
		// Workers
		let url = URL(string: Endpoint.listWorkersAsAdmin)!
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
						let workers = json["Workers"] as? [[String: Any]] {
						if status {
							DispatchQueue.main.async {
								self.workerCells = [AdminWorker]()
								for worker in workers {
									if
										let id = worker["Worker_ID"] as? Int,
										let firstName = worker["First_name"] as? String,
										let lastName = worker["Last_name"] as? String,
										let type = worker["Worker_type"] as? String,
										let ssn = worker["SSN"] as? String,
										let salary = worker["Salary"] as? Int {
										self.workerCells.append(AdminWorker(id: id, firstName: firstName, lastName: lastName, type: type, ssn: ssn, salary: salary))
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
	}
	
	override func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
		return workerCells.count
	}
	
	override func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
		let cell = tableView.dequeueReusableCell(withIdentifier: "cell", for: indexPath)
		cell.textLabel?.text = "\(workerCells[indexPath.row].firstName) \(workerCells[indexPath.row].lastName)"
		return cell
	}
	
	override func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
		let storyboard = UIStoryboard(name: "Admin", bundle: nil)
		guard let vc = storyboard.instantiateViewController(withIdentifier: "AdminWorkerTableViewController") as? AdminWorkerTableViewController else { fatalError() }
		vc.worker = workerCells[indexPath.row]
		self.navigationController?.pushViewController(vc, animated: true)
	}
}
