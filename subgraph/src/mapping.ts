import {
    JobCreated as JobCreatedEvent,
    WorkSubmitted as WorkSubmittedEvent,
    FundsReleased as FundsReleasedEvent,
    JobDisputed as JobDisputedEvent,
    MilestoneReleased as MilestoneReleasedEvent,
    MilestonesDefined as MilestonesDefinedEvent
} from "../generated/FreelanceEscrow/FreelanceEscrow"
import { Job, User, Milestone } from "../generated/schema"
import { BigInt } from "@graphprotocol/graph-ts"

export function handleJobCreated(event: JobCreatedEvent): void {
    let job = new Job(event.params.jobId.toString())
    job.jobId = event.params.jobId
    job.client = event.params.client
    job.freelancer = event.params.freelancer
    job.amount = event.params.amount
    job.status = 0 // Created
    job.paid = false
    job.createdAt = event.block.timestamp
    job.updatedAt = event.block.timestamp
    job.save()

    let client = User.load(event.params.client.toHexString())
    if (client == null) {
        client = new User(event.params.client.toHexString())
        client.save()
    }

    let freelancer = User.load(event.params.freelancer.toHexString())
    if (freelancer == null) {
        freelancer = new User(event.params.freelancer.toHexString())
        freelancer.save()
    }
}

export function handleWorkSubmitted(event: WorkSubmittedEvent): void {
    let job = Job.load(event.params.jobId.toString())
    if (job) {
        job.resultUri = event.params.resultUri
        job.status = 1 // Ongoing
        job.updatedAt = event.block.timestamp
        job.save()
    }
}

export function handleFundsReleased(event: FundsReleasedEvent): void {
    let job = Job.load(event.params.jobId.toString())
    if (job) {
        job.status = 2 // Completed
        job.paid = true
        job.nftId = event.params.nftId
        job.updatedAt = event.block.timestamp
        job.save()
    }
}

export function handleJobDisputed(event: JobDisputedEvent): void {
    let job = Job.load(event.params.jobId.toString())
    if (job) {
        job.status = 3 // Disputed
        job.updatedAt = event.block.timestamp
        job.save()
    }
}

export function handleMilestonesDefined(event: MilestonesDefinedEvent): void {
    let amounts = event.params.amounts
    let descriptions = event.params.descriptions

    for (let i = 0; i < amounts.length; i++) {
        let milestoneId = event.params.jobId.toString() + "-" + i.toString()
        let milestone = new Milestone(milestoneId)
        milestone.job = event.params.jobId.toString()
        milestone.index = BigInt.fromI32(i)
        milestone.amount = amounts[i]
        milestone.description = descriptions[i]
        milestone.isReleased = false
        milestone.save()
    }
}

export function handleMilestoneReleased(event: MilestoneReleasedEvent): void {
    let milestoneId = event.params.jobId.toString() + "-" + event.params.milestoneId.toString()
    let milestone = Milestone.load(milestoneId)
    if (milestone) {
        milestone.isReleased = true
        milestone.save()
    }
}
