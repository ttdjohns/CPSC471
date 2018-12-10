//
//  TeamsViewController.swift
//  project-pro
//
//  Created by Anton Lysov on 2018-12-03.
//  Copyright © 2018 Anton Lysov. All rights reserved.
//

import UIKit

class TeamsViewController: UIViewController {

	@IBOutlet weak var tableView: UITableView!
	var cells = [Team]()
	
	override func viewDidLoad() {
		super.viewDidLoad()
		tableView.tableFooterView = UIView()
		if let accessLevel = User.accessLevel, accessLevel != "2" {
			navigationItem.rightBarButtonItem = UIBarButtonItem(barButtonSystemItem: .add, target: self, action: #selector(addTeamButtonDidPress))
		}
	}
	
	@objc func addTeamButtonDidPress() {
		let storyboard = UIStoryboard(name: "Admin", bundle: nil)
		let vc = storyboard.instantiateViewController(withIdentifier: "AddTeamNavigationController")
		self.show(vc, sender: true)
	}
	
	override func viewWillAppear(_ animated: Bool) {
		super.viewWillAppear(animated)
		
		let url = URL(string: Endpoint.listTeams)!
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
}

extension TeamsViewController: UITableViewDataSource, UITableViewDelegate {
	
	func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
		return self.cells.count
	}
	func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
		let cell = tableView.dequeueReusableCell(withIdentifier: "cell") as! UITableViewCell
		cell.textLabel?.text = "\(cells[indexPath.row].name)"
		
		return cell
	}
	
	func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
		let storyboard = UIStoryboard(name: "Admin", bundle: nil)
		guard let vc = storyboard.instantiateViewController(withIdentifier: "TeamTableViewController") as? TeamTableViewController else { fatalError() }
		vc.team = self.cells[indexPath.row]
		self.navigationController?.pushViewController(vc, animated: true)
	}
	
}
