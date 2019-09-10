#!/usr/bin/env bash

# This script uses YUM, so will only work on linux. And since it uses specific packages provided by AWS, I can't guarantee it
# would work on any other image.

# install base packages from the AWS repos. This will start the clamd.scan service automatically (but with the wrong settings)
yum install -y clamav clamav-scanner-sysvinit clamav-update

# backup and update the freshclam config so it's able to update. Freshclam is the package which maintains the virus definitions.
# after freshclam is set up, you need to trigger it to update (and in turn, notify clamd. So I suggest a cron job. The documentation
# actually suggests this is supplied in the yum installs, but I couldn't find it - if you do, let me know.
# the following lines use a program called sed to do regex replaces within the specified file.
\cp /etc/freshclam.conf /etc/freshclam.conf.bak
sed -i '/^Example/d' /etc/freshclam.conf
sed -i 's/#LogTime yes/LogTime yes/g' /etc/freshclam.conf
# this is the line which ensures clamd gets notified about updates from freshclam
sed -i 's/#NotifyClamd \/path\/to\/clamd.conf/NotifyClamd \/etc\/clamd.d\/scan.conf/g' /etc/freshclam.conf


# backup and update the clamd conf - we need to set the correct socket and specify nodejs as the user and group,
# so that we can call the service via socket from our codebase
\cp /etc/clamd.d/scan.conf /etc/clamd.d/scan.conf.bak
sed -i '/^Example/d' /etc/clamd.d/scan.conf
sed -i 's/#LogFile /LogFile /g' /etc/clamd.d/scan.conf
sed -i 's/#LogTime /LogTime /g' /etc/clamd.d/scan.conf
# important line which enables the TCP socket connections
sed -i 's/#LocalSocket /LocalSocket /g' /etc/clamd.d/scan.conf
# this line and the next specify nodejs - this is a user within banking clouds environments - you'll need to create a user
# for your own instance, and use that name here
sed -i 's/#LocalSocketGroup virusgroup/LocalSocketGroup nodejs/g' /etc/clamd.d/scan.conf
sed -i 's/User clamscan/User nodejs/g' /etc/clamd.d/scan.conf


# change ownership of the socket and the log file so that our nodejs can access it
# as above, nodejs is a banking cloud user, you need to use your own
mkdir /var/run/clamd.scan
chown -R nodejs:nodejs /var/run/clamd.scan
touch /var/log/clamd.scan
chown nodejs:nodejs /var/log/clamd.scan

# run freshclam to update virus definitions. It won't be able to notify clamd.scan as it won't currently be configured
# but that's fine.
freshclam

# restart the clamd.scan service so it picks up the new configs and latest definitions
service clamd.scan restart

# clamd.scan is now accessible using the command: clamdscan
# the node code will access it via the TCP socket specified in the scan.conf as LocalSocket. Ensure these values match

