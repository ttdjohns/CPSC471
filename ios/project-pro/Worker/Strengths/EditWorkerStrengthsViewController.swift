//
//  AllStrengthsViewController.swift
//  project-pro
//
//  Created by Anton Lysov on 2018-12-02.
//  Copyright © 2018 Anton Lysov. All rights reserved.
//

import UIKit

class EditWorkerStrengthsViewController: UIViewController {
	
	@IBOutlet weak var tableView: UITableView!
	var cells = [Strength]()
	// Worker has to have at least 5 strengths
	var selectedCells = [IndexPath]()
	
	override func viewDidLoad() {
		super.viewDidLoad()
		
		self.tableView.tableFooterView = UIView()
		
		let url = URL(string: Endpoint.listStrengths)!
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
								for strength in strengths {
									if
										let id = strength["Strength_ID"] as? Int,
										let name = strength["Strength_name"] as? String,
										let description = strength["Strength_description"] as? String {
										self.cells.append(Strength(id: id, name: name, description: description))
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
	
	@IBAction func cancelButtonDidPress(_ sender: Any) {
		self.dismiss(animated: true, completion: nil)
	}
	
	@IBAction func doneButtonDidPress(_ sender: Any) {
		let url = URL(string: Endpoint.editWorkerStrengths)!
		// create the session object
		let session = URLSession.shared
		// now create the URLRequest object using the url object
		var request = URLRequest(url: url)
		request.httpMethod = "POST" //set http method as POST
		do {
			let indices = self.selectedCells.map({ indexPath in return indexPath.row + 1 })
			let parameters: Parameters = [
				"id": Int(User.id!)!,
				"Strength_IDs": indices
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
						let status = json["status"] as? Bool {
						if status {
							DispatchQueue.main.async {
								self.dismiss(animated: true, completion: nil)
							}
						} else {
							DispatchQueue.main.async {
								let alert = UIAlertController(title: "Invalid Input", message: nil, preferredStyle: .alert)
								alert.addAction(UIAlertAction(title: "OK", style: .default, handler: nil))
								self.present(alert, animated: true, completion: nil)
							}
							print("POST /editWorker Error")
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

extension EditWorkerStrengthsViewController: UITableViewDataSource,  UITableViewDelegate  {
	func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
		return self.cells.count
	}
	func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
		let cell = tableView.dequeueReusableCell(withIdentifier: "cell") as! StrengthTableViewCell
		cell.nameLabel.text = "Name: \(cells[indexPath.row].name)"
		let description = cells[indexPath.row].description
		if description.count > 0 {
			cell.descriptionLabel.text = description
		} else {
			cell.descriptionLabel.text = "No description"
		}
		
		return cell
	}
	func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
		self.tableView.deselectRow(at: indexPath, animated: true)
		if let cell = tableView.cellForRow(at: indexPath) {
			if self.selectedCells.contains(indexPath)
			{
				cell.accessoryType = .none
				_ = self.selectedCells.index(of: indexPath).map { self.selectedCells.remove(at: $0) }
			} else {
				cell.accessoryType = .checkmark
				self.selectedCells.append(indexPath)
			}
		}
	}
}

