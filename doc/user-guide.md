# LendLoop user guide

LendLoop is a tool-lending board for a neighborhood. Neighbors list the tools they are happy to lend, ask to borrow each other's tools for specific dates, and get notifications and overdue reminders along the way.

> **Notifications are simulated in this version.** LendLoop works out who to tell and when, but it writes each message to the automation log instead of sending an email. Check the activity lines described in [Notifications and reminders](#notifications-and-reminders) to see what would have been sent.

## Before you sign in

The home page shows the name and category of every tool available right now. It never shows who owns a tool. To list or borrow anything, choose **Sign in to lend or borrow**.

## How a loan works

1. **List.** A lender adds a tool under **My listings**.
2. **Request.** A borrower finds the tool under **All tools** and asks for it on specific dates.
3. **Decide.** The lender approves or declines the request under **Incoming**.
4. **Hand over.** Once a request is approved, each person can see the other's email address to arrange the handover.
5. **Return.** When the tool comes back, the lender chooses **Mark as returned**, and the tool becomes available again.

## Pages

### All tools

Every listed tool, with its condition, description, lender, and availability. Use the buttons at the top to filter by category.

Tools marked **Available** have a **Request to borrow** button. Pick a **From** and **Until** date, then choose **Send request**. If you already have a pending request for a tool, the card links to **My requests** instead.

### My listings

The tools you lend. Choose **List a tool** and enter:

| Field       | Details                                                         |
| ----------- | --------------------------------------------------------------- |
| Name        | Up to 80 characters                                             |
| Category    | Power tools, Hand tools, Garden, Kitchen, Camping, or Other     |
| Condition   | New, Good, Fair, or Worn                                        |
| Description | Up to 500 characters. Mention anything a borrower needs to know |

You can **Edit** a listing at any time. You can **Delete** one unless the tool is on loan. Deleting a listing cancels its pending requests and tells those borrowers.

### My requests

Everything you have asked to borrow, newest first. You can choose **Cancel request** while a request is still pending. Once it is approved, the lender's email appears on the card.

### Incoming

Requests for your tools, in three groups:

- **Needs your decision:** choose **Approve** or **Decline**.
- **Out on loan:** the tools people have now, with their email address and **Mark as returned**.
- **History:** requests that were declined or cancelled, and loans that were returned or closed.

### Admin

Only admins see this page. See [For admins](#for-admins).

## Request statuses

| Status    | What it means                                                                         |
| --------- | ------------------------------------------------------------------------------------- |
| Pending   | Waiting for the lender to decide                                                      |
| On loan   | Approved. The tool is with the borrower                                               |
| Declined  | The lender said no, or approved other dates                                           |
| Cancelled | The borrower withdrew, or the listing was removed                                     |
| Returned  | The lender confirmed the tool came back                                               |
| Closed    | An admin removed the listing during the loan. Nobody has confirmed the tool came back |

An **Overdue** badge appears beside **On loan** once the end date has passed.

A **Trusted Lender** badge means an admin has vouched for that person.

## Borrowing rules

- You can't borrow your own tool.
- You can't request a tool that is on loan. Try again when it is back.
- You can have one pending request per tool.
- Dates can't be in the past, and a loan can last up to 90 days.
- A tool has one loan at a time, and it counts as on loan from the moment of approval, even if the loan starts later.
- Approving a request automatically declines other pending requests with overlapping dates. Requests for other dates stay pending, and the lender can approve them after the tool is returned.
- Only the lender can mark a loan returned, so a borrower can't clear an overdue loan without giving the tool back.
- You see someone's email only while you have an active loan with them.

## Notifications and reminders

| When                              | Who hears about it                                      |
| --------------------------------- | ------------------------------------------------------- |
| Someone requests your tool        | The lender                                              |
| A request is approved or declined | The borrower                                            |
| A borrower cancels a request      | The lender                                              |
| A listing is removed              | Borrowers with pending requests or an active loan on it |
| A loan is marked returned         | The borrower                                            |
| A loan is overdue                 | The borrower, daily at 09:00 UTC                        |

Cards under **My requests** and **Incoming** show the latest automation activity, such as "Reminder sent 2 days ago". Overdue reminders use the UTC date, so one can count a loan as late while it is still the due date where you live.

## For admins

The **Admin** page has four tabs:

- **Loans:** every active loan, most overdue first, plus every returned loan and every loan closed by an admin.
- **Lenders:** every member. Choose **Mark as Trusted Lender** or **Remove Trusted Lender**.
- **Listings:** every listing, with **Remove listing**. Removing a tool that is on loan also closes its loan and tells the borrower. Use this when a lender can no longer mark it returned.
- **Automation:** recent notifications and reminders, with their status, plus any failed workflow runs. Check here if a notification seems to be missing.

Admins are appointed from the command line. The [README](../README.md#local-setup) has the command.

## Common questions

**Why is there no request button on a tool?** It is your own listing, it is on loan, or you already have a pending request for it.

**Why did my request get declined when the lender did nothing?** The lender approved someone else for overlapping dates.

**Why can't I approve this request?** The tool is already on loan, or the request's dates have passed. Decline it, or mark the current loan returned first.

**Why can't I delete my listing?** The tool is on loan. Mark it returned first.

**Why was my active loan closed?** An admin removed the listing. Contact the lender if you still have the tool.

**Why does the page say it couldn't verify my session?** Sign out and sign in again.
