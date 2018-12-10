//
//  DonationsViewController.swift
//  project-pro
//
//  Created by Anton Lysov on 2018-12-03.
//  Copyright © 2018 Anton Lysov. All rights reserved.
//

import UIKit

class DonationsViewController: UIViewController {
	
	@IBOutlet weak var tableView: UITableView!
	var cells = [Donation]()

    override func viewDidLoad() {
        super.viewDidLoad()

		navigationItem.rightBarButtonItem = UIBarButtonItem(barButtonSystemItem: .add, target: self, action: #selector(addDonationButtonDidPress))
		
		self.tableView.tableFooterView = UIView()
	}
	
	override func viewWillAppear(_ animated: Bool) {
		super.viewWillAppear(animated)
		
		let url = URL(string: Endpoint.listDonations)!
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
						let donations = json["Donations"] as? [[String: Any]] {
						if status {
							DispatchQueue.main.async {
								self.cells = [Donation]()
								for donation in donations {
									if
										let id = donation["Donation_ID"] as? Int,
										let amount = donation["Amount"] as? Int,
										let causeID = donation["Cause_ID"] as? Int,
										let causeName = donation["Cause_name"] as? String,
										let causeDescription = donation["Cause_description"] as? String,
										let donorID = donation["Donor_ID"] as? Int,
										let firstName = donation["First_name"] as? String,
										let lastName = donation["Last_name"] as? String,
										let mailingAddress = donation["Mailing_address"] as? String {
										self.cells.append(Donation(id: id, amount: amount, donorID: donorID, causeID: causeID, causeName: causeName, causeDescription: causeDescription, firstName: firstName, lastName: lastName, mailingAddress: mailingAddress))
									}
								}
								self.tableView.reloadData()
							}
						} else {
							print("/Donations Error")
						}
					}
				}
			} catch let error {
				print(error.localizedDescription)
			}
		})
		task.resume()
	}
	
	@objc func addDonationButtonDidPress() {
		let storyboard = UIStoryboard(name: "Admin", bundle: nil)
		let vc = storyboard.instantiateViewController(withIdentifier: "AddDonationNavigationController")
		self.show(vc, sender: nil)
	}

}

extension DonationsViewController: UITableViewDataSource, UITableViewDelegate {
	
	func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
		return self.cells.count
	}
	func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
		let cell = tableView.dequeueReusableCell(withIdentifier: "cell") as! DonationTableViewCell
		cell.amountLabel.text = "\(cells[indexPath.row].amount)"
		cell.donorIDLabel.text = "\(cells[indexPath.row].causeName)"
		cell.causeIDLabel.text = "\(cells[indexPath.row].firstName) \(cells[indexPath.row].firstName)"
		
		return cell
	}
	
	func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
		let storyboard = UIStoryboard(name: "Admin", bundle: nil)
		let newNavigationController = storyboard.instantiateViewController(withIdentifier: "EditDonationNavigationController")
		guard let vc = newNavigationController.children.first as? EditDonationTableViewController else { fatalError() }
		vc.donation = self.cells[indexPath.row]
		self.present(newNavigationController, animated: true, completion: nil)
	}
	
}
