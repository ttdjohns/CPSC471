//
//  ProjectsViewController.swift
//  project-pro
//
//  Created by Anton Lysov on 2018-12-04.
//  Copyright © 2018 Anton Lysov. All rights reserved.
//

import UIKit

class ProjectsViewController: UIViewController {

	@IBOutlet weak var tableView: UITableView!
	var cells = [Project]()
	
	override func viewDidLoad() {
		super.viewDidLoad()
		
		navigationItem.rightBarButtonItem = UIBarButtonItem(barButtonSystemItem: .add, target: self, action: #selector(addProjectButtonDidPress))
		tableView.tableFooterView = UIView()
	}
	
	override func viewWillAppear(_ animated: Bool) {
		super.viewWillAppear(animated)
		
		let url = URL(string: Endpoint.listProjects)!
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
						let tasks = json["Projects"] as? [[String: Any]] {
						if status {
							DispatchQueue.main.async {
								self.cells = [Project]()
								for task in tasks {
									if
										let id = task["Project_ID"] as? Int,
										let name = task["Project_name"] as? String,
										let description = task["Project_description"] as? String {
										let project = Project(id: id, name: name, description: description)
										self.cells.append(project)
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
	
	@objc func addProjectButtonDidPress() {
		let storyboard = UIStoryboard(name: "Manager", bundle: nil)
		let vc = storyboard.instantiateViewController(withIdentifier: "AddProjectNavigationController")
		self.show(vc, sender: nil)
	}

}

extension ProjectsViewController: UITableViewDataSource, UITableViewDelegate {
	
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
		let storyboard = UIStoryboard(name: "Manager", bundle: nil)
		guard let vc = storyboard.instantiateViewController(withIdentifier: "ProjectTableViewController") as? ProjectTableViewController else { fatalError() }
		vc.project = cells[indexPath.row]
		vc.title = "\(cells[indexPath.row].name) Project"
		self.navigationController?.pushViewController(vc, animated: true)
	}
}
