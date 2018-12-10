//
//  WorkerTasksViewController.swift
//  project-pro
//
//  Created by Anton Lysov on 2018-12-02.
//  Copyright © 2018 Anton Lysov. All rights reserved.
//

import UIKit

class WorkerTasksViewController: UIViewController {
	
	@IBOutlet weak var containerAssignedTasksView: UIView!
	@IBOutlet weak var containerDesiredTasksView: UIView!
	
	@objc func editButtonDidPress() {
		let storyboard = UIStoryboard(name: "Worker", bundle: nil)
		let vc = storyboard.instantiateViewController(withIdentifier: "EditWorkerDesiredTasksNavigationController")
		self.show(vc, sender: nil)
	}
	
	@IBAction func showComponent(sender: UISegmentedControl) {
		if sender.selectedSegmentIndex == 0 {
			navigationItem.rightBarButtonItem = nil
			self.containerAssignedTasksView.alpha = 1
			self.containerDesiredTasksView.alpha = 0
		} else {
			navigationItem.rightBarButtonItem = UIBarButtonItem(title: "Edit", style: .plain, target: self, action: #selector(editButtonDidPress))
			self.containerAssignedTasksView.alpha = 0
			self.containerDesiredTasksView.alpha = 1
		}
	}

}
