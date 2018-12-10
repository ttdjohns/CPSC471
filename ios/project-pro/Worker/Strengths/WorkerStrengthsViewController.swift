//
//  WorkerStrengthsViewController.swift
//  project-pro
//
//  Created by Anton Lysov on 2018-12-02.
//  Copyright © 2018 Anton Lysov. All rights reserved.
//

import UIKit

class WorkerStrengthsViewController: UIViewController {
	
	@IBOutlet weak var tableView: UITableView!
	var cells = [WorkerStrength]() {
		didSet {
			cells = cells.sorted(by: { $0.rank < $1.rank })
		}
	}
	
	override func viewDidLoad() {
		super.viewDidLoad()
		self.tableView.tableFooterView = UIView()
	}
	
	override func viewWillAppear(_ animated: Bool) {
		super.viewWillAppear(animated)
		
		let url = URL(string: Endpoint.listWorkerStrengths)!
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
						let strengths = json["Strengths"] as? [[String: Any]] {
						if status {
							DispatchQueue.main.async {
								self.cells = [WorkerStrength]()
								for strength in strengths {
									if
										let rank = strength["Strength_rank"] as? Int,
										let id = strength["Strength_ID"] as? Int,
										let name = strength["Strength_name"] as? String,
										let description = strength["Strength_description"] as? String {
										self.cells.append(WorkerStrength(rank: rank, id: id, name: name, description: description))
									}
								}
								self.tableView.reloadData()
							}
						} else {
							print("POST /login Error")
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

extension WorkerStrengthsViewController: UITableViewDataSource, UITableViewDelegate {
	
	func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
		return self.cells.count
	}
	func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
		let cell = tableView.dequeueReusableCell(withIdentifier: "cell") as! StrengthTableViewCell
		cell.nameLabel.text = cells[indexPath.row].name
		cell.rankLabel.text = "Rank: \(cells[indexPath.row].rank!)"
		let description = cells[indexPath.row].description
		if description.count > 0 {
			cell.descriptionLabel.text = description
		} else {
			cell.descriptionLabel.text = "No description"
		}
		
		return cell
	}
}
