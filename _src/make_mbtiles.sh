# installs dependencies, downloads data & regenerates mbtiles for all of OpenAddresses
# assumes appropriate AWS credentials in environment variables

set -e

ROOTDIR=`pwd`

rm -rf tippecanoe build openaddresses-download

sudo apt-get update -y
sudo apt-get install -y git make g++ libsqlite3-dev protobuf-compiler libprotobuf-dev awscli nodejs
git clone https://github.com/mapbox/tippecanoe.git
cd $ROOTDIR/tippecanoe && make
curl https://raw.githubusercontent.com/sbma44/monoxylon/master/monoxylon.js > $ROOTDIR/tippecanoe/monoxylon.js

# download OpenAddresses data
mkdir $ROOTDIR/openaddresses-download
cd $ROOTDIR/openaddresses-download
#for a in $(aws s3 ls s3://data.openaddresses.io | awk -F ' ' '{print $4}' | grep csv)
#do
#    aws s3 cp --region us-east-1 s3://data.openaddresses.io/$a $ROOTDIR/openaddresses-download/$a
#done
parallel "aws s3 cp --region us-east-1 s3://data.openaddresses.io/{} $ROOTDIR/openaddresses-download/{}" ::: $(aws s3 ls s3://data.openaddresses.io | awk -F ' ' '{print $4}' | grep csv)

# concatenate address files, stripping headers
mkdir $ROOTDIR/build
touch $ROOTDIR/build/out.csv
for a in $(ls $ROOTDIR/openaddresses-download)
do
    tail -n +2 $ROOTDIR/openaddresses-download/$a >> $ROOTDIR/build/out.csv
    rm $ROOTDIR/openaddresses-download/$a
done

# build mbtiles
# NOTE: the "-r 1.5" flag is aggressive about retaining geometry, producing a very
# large mbtiles tile. Increasing this value is probably wise. Tippecanoe's default is 
# 2.5, which is too high to produce pleasing results.
cat $ROOTDIR/build/out.csv | nodejs $ROOTDIR/tippecanoe/monoxylon.js | $ROOTDIR/tippecanoe/tippecanoe -r 2 -l "openaddresses" -X -n "OpenAddresses `date`" -f -o $ROOTDIR/openaddresses.mbtiles


# upload & replace existing source if appropriate 
if [ -n "$MapboxAccessToken" ]
then
    sudo apt-get install -y npm
    git clone https://github.com/mapbox/mapbox-upload.git $ROOTDIR/mapbox-upload
    cd $ROOTDIR/mapbox-upload
    git fetch && git checkout -b cli origin/cli
    npm install
    nodejs $ROOTDIR/mapbox-upload/bin/upload.js open-addresses.lec54np1 $ROOTDIR/openaddresses.mbtiles
fi
