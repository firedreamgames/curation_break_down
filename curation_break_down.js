 steem.api.setOptions({
      url: 'https://api.steemit.com'
    });
    var link;
    var author;
    var permlink;
    var votes = [];
    var p_date;
    var post_pay;
    var post_pay_sbd;
    var curation_pay_sbd;
    var total_pay_sbd;
    var curation_pay;
    var total_pay;
    var is_paid;
    var feed;
    var total_net_rshares;

    steem.api.getFeedHistory(function(err, res) {
      feed = parseFloat(res.current_median_history.base);

    });


    var clearSearchFields = function() {
      $('#voter,#rshares,#rshares_before,#curation_wo_penalty,#vote_time,#SP_early_penalty,#SP_curation,#vote_sp,#performance,#post_pay,#feed_price,#post_date,#curation,#net_shares').html('');
    }


    function Start_Analysis() {
      clearSearchFields();
      link = document.getElementById("link").value; //get the url from the textbox
      var perm = link.split("/"); //split the url to get permlink and user
      var length_perm = perm.length;
      permlink = perm[length_perm - 1]; //the permlink is the last element after "/" sign 
      user_raw = perm[length_perm - 2]; //form the array to find the user to be voted - user is found at the one before final element of array 
      usmat = user_raw.split("@"); //we need the username without @sign, so split the raw array
      author = usmat[usmat.length - 1]; //user name is the last element of the array  

      steem.api.getContent(author, permlink, function(err, result) {
        votes = result.active_votes;
        console.log(err, result, votes);
        p_date = result.created;

        if (parseFloat(result.vote_rshares) == 0) {
          is_paid = 1;
          post_pay_sbd = parseFloat(result.total_payout_value).toFixed(3);
          curation_pay_sbd = parseFloat(result.curator_payout_value).toFixed(3);
          total_pay_sbd = parseFloat(post_pay_sbd) + parseFloat(curation_pay_sbd);
          post_pay = (post_pay_sbd / feed).toFixed(3);
          curation_pay = (curation_pay_sbd / feed).toFixed(3);
          total_pay = post_pay + curation_pay;
        }

        if (parseFloat(result.vote_rshares) != 0) {
          is_paid = 0;
          post_pay_sbd = (parseFloat(result.pending_payout_value) * 0.75).toFixed(3);
          curation_pay_sbd = (parseFloat(result.pending_payout_value) * 0.25).toFixed(3);
          total_pay_sbd = parseFloat(post_pay_sbd) + parseFloat(curation_pay_sbd);
          post_pay = (post_pay_sbd / feed).toFixed(3);
          curation_pay = (curation_pay_sbd / feed).toFixed(3);
          total_pay = post_pay + curation_pay;
        }

        //console.log(is_paid,feed,p_date,post_pay,curation_pay,total_pay_sbd);
        calculate(result, votes);
      });
    }

    function calculate(result, votes) {
      total_net_rshares = 0;
      var before = 0;
      var now;
      var voter = [];
      var voter_before = [];
      var voter_now = [];
      var v_time = [];
      var time_diff = [];
      var gross_curation = [];
      var penalty = [];
      var net_curation = [];
      var vote_value = [];
      var r_shares = [];

      votes.sort(compare);
      for (let i = 0; i < votes.length; i++) {
        total_net_rshares = total_net_rshares + parseInt(votes[i].rshares);
        r_shares.push(votes[i].rshares);
      }

      //console.log(total_net_rshares);
      var sbd_per_shares = total_pay_sbd / total_net_rshares;



      before = 0;
      for (let i = 0; i < votes.length; i++) {
        now = before + parseInt(votes[i].rshares);
        voter_before.push(before);
        voter_now.push(now);
        voter.push(votes[i].voter);
        v_time.push(votes[i].time);
        vote_value.push(parseInt(votes[i].rshares) * sbd_per_shares);
        //console.log(parseInt(votes[i].rshares));
        //console.log(total_pay_sbd,sbd_per_shares);            
        var ratio = (Math.sqrt(now) - Math.sqrt(before)) / (Math.sqrt(total_net_rshares));
        var gc=curation_pay_sbd * ratio
        if(gc<0){
          gc=0;
        }
        
        gross_curation.push(gc);
        


        p_date_parsed = Date.parse(p_date);
        v_date = votes[i].time;
        v_date_parsed = Date.parse(v_date);

        var vote_late = (v_date_parsed - p_date_parsed) / (30 * 60 * 1000);
        if (vote_late >= 1) {
          vote_late = 1;
        }
        //console.log(vote_late);
        
        
        var curation_loss = (gc * (1 - vote_late));
        penalty.push(curation_loss);
        net_curation.push(gc - curation_loss);


        before = now;

      }

      to_div(voter, r_shares, voter_before, voter_now, v_time, vote_value, gross_curation, penalty, net_curation);

    }

    function to_div(voter, r_shares, voter_before, voter_now, v_time, vote_value, gross_curation, penalty, net_curation) {

      document.getElementById("post_pay").innerHTML = parseFloat(total_pay_sbd).toFixed(3) + " SBD";
      document.getElementById("curation").innerHTML = parseFloat(curation_pay_sbd).toFixed(3) + " SBD";
      document.getElementById("net_shares").innerHTML = total_net_rshares;
      document.getElementById("feed_price").innerHTML = feed;
      document.getElementById("post_date").innerHTML = p_date;

      for (let i = 0; i < voter.length; i++) {
        document.getElementById("voter").innerHTML = document.getElementById("voter").innerHTML + voter[i] + "<br />";
        document.getElementById("rshares").innerHTML = document.getElementById("rshares").innerHTML + r_shares[i] + "<br />";
        document.getElementById("rshares_before").innerHTML = document.getElementById("rshares_before").innerHTML + voter_before[i] + "<br />";
        document.getElementById("curation_wo_penalty").innerHTML = document.getElementById("curation_wo_penalty").innerHTML + gross_curation[i].toFixed(3) + " SBD" + "(" + (gross_curation[i] / feed).toFixed(3) + " SP)" + "<br />";
        document.getElementById("vote_time").innerHTML = document.getElementById("vote_time").innerHTML + v_time[i] + "<br />";
        document.getElementById("SP_early_penalty").innerHTML = document.getElementById("SP_early_penalty").innerHTML + penalty[i].toFixed(3) + " SBD" + "<br />";
        document.getElementById("SP_curation").innerHTML = document.getElementById("SP_curation").innerHTML + net_curation[i].toFixed(3) + " SBD" + "(" + (net_curation[i] / feed).toFixed(3) + " SP)" + "<br />";
        document.getElementById("vote_sp").innerHTML = document.getElementById("vote_sp").innerHTML + vote_value[i].toFixed(3) + " SBD" + "<br />";
        document.getElementById("performance").innerHTML = document.getElementById("performance").innerHTML + "%" + ((net_curation[i] / vote_value[i]) * 100).toFixed(1) + "<br />";

      }

    }




    function compare(a, b) {

      const timeA = a.time;
      const timeB = b.time;

      let comparison = 0;
      if (timeA > timeB) {
        comparison = 1;
      } else if (timeA < timeB) {
        comparison = -1;
      }
      return comparison;
    }