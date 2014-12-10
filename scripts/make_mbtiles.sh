# installs dependencies, downloads data & regenerates mbtiles for all of OpenAddresses
# assumes appropriate AWS credentials in environment variables

set -e

ROOTDIR=`pwd`

sudo apt-get update -y
sudo apt-get install -y git libsqlite3-dev protobuf-compiler libprotobuf-dev awscli nodejs
git clone git@github.com:mapbox/tippecanoe.git
cd $ROOTDIR/tippecanoe && make
curl https://raw.githubusercontent.com/sbma44/monoxylon/master/monoxylon.js > $ROOTDIR/tippecanoe/monoxylon.js

# download OpenAddresses data
mkdir $ROOTDIR/openaddresses
cd $ROOTDIR/openaddresses
for a in $(aws s3 ls s3://data.openaddresses.io | awk -F ' ' '{print $4}' | grep csv)
do
    aws s3 cp --region us-east-1 s3://data.openaddresses.io/$a $ROOTDIR/openaddresses/$a
done

# concatenate address files, stripping headers
mkdir $ROOTDIR/build
touch $ROOTDIR/build/out.csv
for a in $(ls $ROOTDIR/openaddresses)
do
    tail -n +1 $ROOTDIR/openaddresses/$a >> $ROOTDIR/build/out.csv
    rm $ROOTDIR/openaddresses/$a
done

# build mbtiles
cat $ROOTDIR/build/out.csv | node $ROOTDIR/tippecanoe/monoxylon.js | $ROOTDIR/tippecanoe/tippecanoe -l "openaddresses" -n "OpenAddresses `date`" -f -o $ROOTDIR/openaddresses/openaddresses.mbtiles

