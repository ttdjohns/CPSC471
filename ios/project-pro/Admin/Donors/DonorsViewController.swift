//
//  DonorsViewController.swift
//  project-pro
//
//  Created by Anton Lysov on 2018-12-02.
//  Copyright © 2018 Anton Lysov. All rights reserved.
//

import UIKit

class DonorsViewController: UIViewController {

	@IBOutlet weak var tableView: UITableView!
	var cells = [Donor]()
	
	override func viewDidLoad() {
        super.viewDidLoad()
		
		navigationItem.rightBarButtonItem = UIBarButtonItem(barButtonSystemItem: .add, target: self, action: #selector(addDonorButtonDidPress))

		self.tableView.tableFooterView = UIView()
		
	}
	
	override func viewWillAppear(_ animated: Bool) {
		super.viewWillAppear(animated)
		
		let url = URL(string: Endpoint.listDonors)!
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
						let strengths = json["Donors"] as? [[String: Any]] {
						if status {
							DispatchQueue.main.async {
								self.cells = [Donor]()
								for strength in strengths {
									if
										let id = strength["Donor_ID"] as? Int,
										let firstName = strength["First_name"] as? String,
										let lastName = strength["Last_name"] as? String,
										let mailingAddress = strength["Mailing_address"] as? String,
										let emails = strength["Emails"] as? [String],
										let phones = strength["Phone_numbers"] as? [String] {
										let donor = Donor(id: id, firstName: firstName, lastName: lastName, mailingAddress: mailingAddress, email: emails.first, phone: phones.first)
										self.cells.append(donor)
									}
								}
								self.tableView.reloadData()
							}
						} else {
							print("/listDonors Error")
						}
					}
				}
			} catch let error {
				print(error.localizedDescription)
			}
		})
		task.resume()
    }
	
	@objc func addDonorButtonDidPress() {
		let storyboard = UIStoryboard(name: "Admin", bundle: nil)
		let vc = storyboard.instantiateViewController(withIdentifier: "AddDonorNavigationController")
		self.show(vc, sender: nil)
	}

}

extension DonorsViewController: UITableViewDataSource, UITableViewDelegate {
	
	func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
		return self.cells.count
	}
	func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
		let cell = tableView.dequeueReusableCell(withIdentifier: "cell") as! DonorTableViewCell
		let firstName = cells[indexPath.row].firstName
		let lastName = cells[indexPath.row].lastName
		cell.nameLabel.text = "\(firstName) \(lastName)"
		if let email = cells[indexPath.row].email {
			cell.emailLabel.text = email
		}
		if let phone = cells[indexPath.row].phone {
			cell.phoneLabel.text = phone
		}
		cell.phoneLabel.text = cells[indexPath.row].mailingAddress
		
		return cell
	}
	
	func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
		let storyboard = UIStoryboard(name: "Admin", bundle: nil)
		let newNavigationController = storyboard.instantiateViewController(withIdentifier: "EditDonorNavigationController")
		guard let vc = newNavigationController.children.first as? EditDonorTableViewController else { fatalError() }
		vc.donor = self.cells[indexPath.row]
		self.present(newNavigationController, animated: true, completion: nil)
	}
	
}
