//
//  ManagerWorkerTableViewController.swift
//  project-pro
//
//  Created by Anton Lysov on 2018-12-05.
//  Copyright © 2018 Anton Lysov. All rights reserved.
//

import UIKit

class AdminWorkerTableViewController: UITableViewController {
	
	@IBOutlet weak var firstNameLabel: UILabel!
	@IBOutlet weak var lastNameLabel: UILabel!
	@IBOutlet weak var salaryLabel: UILabel!
	@IBOutlet weak var ssnLabel: UILabel!
	@IBOutlet weak var typeLabel: UILabel!
	
	var worker: AdminWorker!

    override func viewDidLoad() {
        super.viewDidLoad()

        navigationItem.rightBarButtonItem = UIBarButtonItem(barButtonSystemItem: .edit, target: self, action: #selector(editWorkerButtonDidPress))
    }
	
	override func viewWillAppear(_ animated: Bool) {
		super.viewWillAppear(animated)
		firstNameLabel.text = worker.firstName
		lastNameLabel.text = worker.lastName
		ssnLabel.text = worker.ssn
		typeLabel.text = worker.type
		typeLabel.text = worker.type
	}
	
	@objc func editWorkerButtonDidPress() {
		let storyboard = UIStoryboard(name: "Admin", bundle: nil)
		let newNavigationController = storyboard.instantiateViewController(withIdentifier: "AdminEditWorkerNavigationController")
		guard let vc = newNavigationController.children.first as? AdminEditWorkerTableViewController else { fatalError() }
		vc.worker = worker
		self.present(newNavigationController, animated: true, completion: nil)
	}
	
	override func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
		if indexPath.section == 1 {
			let storyboard = UIStoryboard(name: "Admin", bundle: nil)
			let newNavigationController = storyboard.instantiateViewController(withIdentifier: "AdminAddWorkerToTeamNavigationController")
			guard let vc = newNavigationController.children.first as? AdminAddWorkerToTeamTableViewController else { fatalError() }
			vc.workerID = worker.id
			self.present(newNavigationController, animated: true, completion: nil)
		}
	}
}
