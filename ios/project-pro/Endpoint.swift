//
//  Endpoint.swift
//  project-pro
//
//  Created by Anton Lysov on 2018-12-01.
//  Copyright © 2018 Anton Lysov. All rights reserved.
//

import Foundation

struct Endpoint {
	static let host = "http://169.254.160.121:3000"
	
	// Auth [DONE]
	static let login = host + "/login"
	
	// Worker [DONE]
	static let listWorkerDetails = host + "/listWorkerDetails"
	static let editWorker = host + "/editWorker"
	static let listWorkerStrengths = host + "/listWorkerStrengths"
	static let listStrengths = host + "/listStrengths"
	static let editWorkerStrengths = host + "/editWorkerStrengths"
	static let listDesiredTasks = host + "/listDesiredTasks"
	static let editWorkerDesires = host + "/editWorkerDesires"
	static let listAssignedTasks = host + "/listAssignedTasks"
	
	// Manager
	
	// team [IN PROGRESS]
	static let listWorkers = host + "/listWorkers" // org. workers
	static let listTeamWorkers = host + "/listTeamWorkers" //done
	static let addWorkerToTeam = host + "/addWorkerToTeam" // org. workers
	static let removeWorkerFromTeam = host + "/removeWorkerFromTeam" //done
	// project [DONE]
	static let listProjects = host + "/listProjects"
	static let editProject = host + "/editProject"
	static let addProject = host + "/addProject"
	// project tasks [DONE]
	static let listProjectTasks = host + "/listProjectTasks"
	static let removeProjectTask = host + "/removeProjectTask"
	static let listTeamsWorkingOnProject = host + "/listTeamsWorkingOnProject"
	static let listWorkersForTask = host + "/listWorkersForTask"
	static let addProjectTask = host + "/addProjectTask"
	
	// Admin
	
	// Strengths [DONE]
	static let addStrength = host + "/addStrength"
	static let editStrength = host + "/editStrength"
	static let removeStrength = host + "/removeStrength"
	// Teams [DONE]
	static let addTeam = host + "/addTeam"
	static let listTeams = host + "/listTeams"
	static let editTeam = host + "/editTeam"
	static let removeTeam = host + "/removeTeam"
	// Tasks [DONE]
	static let listTasks = host + "/listTasks"
	static let addTask = host + "/addTask"
	static let editTask = host + "/editTask"
	// Organization Workers [MORNING]
	static let editAccountAccess = host + "/editAccountAccess" //
	static let getUsernameAndPermissionLevel = host + "/getUsernameAndPermissionLevel" //
	static let addWorker = host + "/addWorker" //
	static let removeWorker = host + "/removeWorker" //
	static let editWorkerAsAdmin = host + "/editWorkerAsAdmin" // only available to the admin
	static let listWorkersAsAdmin = host + "/listWorkersAsAdmin" // done
	// Causes [DONE]
	static let addCause = host + "/addCause"
	static let listCauses = host + "/listCauses"
	static let editCause = host + "/editCause"
	static let removeCause = host + "/removeCause"
	// Donations [DONE]
	static let addDonation = host + "/addDonation"
	static let editDonation = host + "/editDonation"
	static let listDonations = host + "/listDonations"
	// Donors [DONE]
	static let addDonor = host + "/addDonor"
	static let listDonors = host + "/listDonors"
	static let editDonor = host + "/editDonor"
	static let removeDonor = host + "/removeDonor"
}

struct BackendURL {
	
	let endpoint: String
	
	init(endpoint: String) {
		self.endpoint = endpoint
	}
	
	func asURL() throws -> URL {
		return URL(string: self.endpoint)!
	}
}
