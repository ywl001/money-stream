<?php
$link = mysql_connect("localhost", "root", "123");
if (!$link) {
	echo "数据库连接失败" . mysql_error();
}
mysql_select_db("police");
mysql_query("SET NAMES utf8");

$postdata = file_get_contents("php://input");

if (isset($postdata) && !empty($postdata)) {
	$request = json_decode($postdata);
	$func = $request->func;
	$data = $request->data;

	call_user_func($func, $data);
	mysql_close($link);
}

function login($data){
	$userName = $data->userName;
	$password = $data->password;
	$sql = "select * from user where userName = '$userName' and password = '$password'";
	getSelectResult($sql);
}

function selectUser($userName){
	$sql = "select * from user where userName = '$userName'";
	getSelectResult($sql);
}

function selectFollowCase($data){
	$sql = "select * from case_follow where userID = $data";
	getSelectResult($sql);
}

function selectAllCase(){
	$sql = "select * from law_case where isLocal = 1 order by id desc limit 200 ";
	getSelectResult($sql);
}

function selectUserCase($userId){
	$sql = "SELECT *
			FROM law_case
			WHERE id IN (
				SELECT caseID
				FROM start_account
				WHERE userID = '$userId'
				GROUP BY caseID
			) order by id desc";
	getSelectResult($sql);
}

function selectStartAccount($caseID){
	$sql = "select * from start_account where caseID = $caseID";
	getSelectResult($sql);
}

//通过姓名或账号查询所属哪个案件
function selectCaseByKeyword($keyword){
	$sql = "SELECT L.*,B.level
	FROM law_case L
	JOIN (
		SELECT caseID,1 as level
		FROM account_extension a
			LEFT JOIN person p ON a.personID = p.id
		WHERE p.name = '$keyword'
			OR a.account = '$keyword'
		UNION
		SELECT caseID,2 as level
		FROM trade_record
		WHERE oppositeAccount = '$keyword'
			OR account = '$keyword'
			OR oppositeName = '$keyword'
	) B
	ON L.id = B.caseID";
	getSelectResult($sql);
}

//通过时间选择出账记录
function selectAccountOutRecord($data)
{
	$sql = "select * from trade_record 
	where account = '$data->account' 
	and tradeTime between '$data->startTime' and '$data->endTime' 
	and inOrOut = '借' 
	order by tradeTime";
	getSelectResult($sql);
}

//通过caseNumber 查询案件是否存在
function selectCaseByCaseNumber($data)
{
    $sql = "select * from law_case where caseNumber = '$data'";
	getSelectResult($sql);
} 

//通过caseid 查询案件
function selectCaseByCaseID($data)
{
    $sql = "select * from law_case where id = '$data'";
	getSelectResult($sql);
} 

function selectAccountExtension($data){
	$sql = "select * from account_extension where account in ($data)";
	getSelectResult($sql);
}

function selectAccountRecord($data){
	$sql = "select * from trade_record where account = '$data' order by tradeTime desc";
	getSelectResult($sql);
}

function selectPersonById($data){
	$sql = "select * from person where id = $data";
	getSelectResult($sql);
}

function selectPersonByIds($data){
	$sql = "select * from person where id in ($data)";
	getSelectResult($sql);
}

function selectPersonByNumber($data){
	$sql = "select * from person where personNumber = '$data'";
	getSelectResult($sql);
}

function selectPersonByCase($data){
	$sql = "SELECT p.* from account_extension a LEFT JOIN person p on a.personID = p.id where caseID = '$data' and personID is not null and (p.isDaji = 1 or p.isLuodi =1) GROUP BY personID";
	getSelectResult($sql);
}


function selectAccountByPerson($data)
{
    $sql = "SELECT e.* from account_extension e LEFT JOIN person p on e.personID = p.id where p.id = '$data'";
	getSelectResult($sql);
} 

function selectLawcaseByAccount($data)
{
    $sql = "SELECT l.*,t.money from trade_record t LEFT JOIN law_case l on t.relationCaseID = l.id WHERE account = '$data' and relationCaseID > 0";
	getSelectResult($sql);
} 

function selectLiushuiCount($data)
{
    $sql = "SELECT sum(money) total from trade_record where account = '$data' and inOrOut = '贷'";
	getSelectResult($sql);
} 

function selectCashRecords($data)
{
    $sql = "SELECT * from trade_record where account = '$data' and markMoney = 1";
	getSelectResult($sql);
} 

function selectAccountRelationRecords($data)
{
    $sql = "SELECT * FROM trade_record t LEFT JOIN law_case l ON t.relationCaseID = l.id WHERE ( relationCaseID > 0 OR markMoney > 0 ) AND account IN ($data)";
	//echo json_encode($sql);
	getSelectResult($sql);
} 

function selectCountInfo(){
	$sql = "SELECT
	lc.caseName,
	ae.account,
	ae.returnMoney,
	ae.returnedMoney,
	ae.cashInfos,
	ae.isFreeze,
	p. name,
	p.personNumber,
	p.phoneNumber,
	p.address,
	p.currentAddress,
	p.isDaji,
	p.isLuodi
	FROM
		account_extension ae
	LEFT JOIN person p ON ae.personID = p.id
	LEFT JOIN law_case lc ON ae.caseID = lc.id
	WHERE
		(
			ae.returnMoney > 0 || ae.returnedMoney > 0 || (
				ae.cashInfos IS NOT NULL && ae.cashInfos != ''
			) || ae.isFreeze = 1
		)
	OR p.isDaji = 1
	OR p.isLuodi = 1";

	getSelectResult($sql);
}

function getSelectResult($sql)
{
	$result = mysql_query($sql);
	$arrResult = array();
	while ($temp = mysql_fetch_assoc($result)) {
		array_push($arrResult, $temp);
	}
	echo json_encode($arrResult);
}

function insert($data)
{
	$tableName = $data->tableName;
	$tableData = $data->tableData;
	$sql = "insert into $tableName (";

	foreach ($tableData as $key => $value) {
		$sql .= $key . ",";
	}
	$sql = substr($sql, 0, strlen($sql) - 1) . ") values (";
	foreach ($tableData as $key => $value) {
		if ($value == 'now()') {
			$sql .= $value . ",";
		} else {
			$sql .= "'" . $value . "',";
		}
	}

	$sql = substr($sql, 0, strlen($sql) - 1) . ")";

	//echo json_encode($sql);
	$result = mysql_query($sql);
	$id = mysql_insert_id();

	$sql_insert = "select * from $tableName where id = $id";
	getSelectResult($sql_insert);
}

function insertArray($data)
{
	$sql = "insert ignore into trade_record (";
	$item = $data[0];
	foreach ($item as $key => $value) {
		$sql .= "`$key`,";
	}
	$sql = substr($sql, 0, strlen($sql) - 1) . ") values ";
	$num = count($data);
	for ($i = 0; $i < $num; $i++) {
		$record = $data[$i];
		$sql .= "(";
		foreach ($record as $key => $value) {
			$value == null || $value == 'null' ? $sql .= "''," : $sql .= "'$value',";
		}
		$sql = substr($sql, 0, strlen($sql) - 1) . "),";
	}
	$sql = substr($sql, 0, strlen($sql) - 1);

	$result = mysql_query($sql);
	echo json_encode($result);
	//echo json_encode($sql);
}

function update($data)
{
	$tableName = $data->tableName;
	$tableData = $data->tableData;
	$id = $data->id;
	$sql = "update $tableName set ";
	foreach ($tableData as $key => $value) {
		if($value == null || $value == 'NaN' || $value == '' || $value == 'null')
			$sql.="$key = null,";
		else
			$sql .= "$key='$value',";
	}
	$sql = substr($sql, 0, strlen($sql) - 1) . " where id = $id";

	$result = mysql_query($sql);
	echo json_encode($result);
	//echo json_encode($sql);
}

function del($data){
	$tableName = $data->tableName;
	$id = $data->id;
	$sql = "delete from $tableName where id = $id";
	$result = mysql_query($sql);
	echo json_encode($result);
}


function editBySql($sql){
	$result = mysql_query($sql);
	echo json_encode($result);
}

function insertOrUpdate($data){
	$tableName = $data->tableName;
	$tableData = $data->tableData;

	$sql = "insert into $tableName (";
	
	foreach ($tableData as $key => $value) {
		$sql .= $key . ",";
	}
	$sql = substr($sql, 0, strlen($sql) - 1) . ") values (";
	foreach ($tableData as $key => $value) {
		if ($value == 'now()') {
			$sql .= $value . ",";
		} 
		elseif($value == null || $value == '' || $value == 'null'){
			$sql.="null,";
		}
		else {
			$sql .= "'" . $value . "',";
		}
	}

	$sql = substr($sql, 0, strlen($sql) - 1) . ")";
	$sql.=" on duplicate key update ";

	foreach ($tableData as $key => $value) {
		if($value == null || $value == '' || $value == 'null')
			$sql.="$key = null,";
		else
			$sql .= "$key='$value',";
	}
	$sql = substr($sql, 0, strlen($sql) - 1);
	echo json_encode($sql);
	//$result = mysql_query($sql);
	//echo json_encode($result);
}


function delByIds($data){
	$tableName = $data->tableName;
	$ids = $data->ids;
	$sql = "delete from $tableName where id in($ids)";
	$result = mysql_query($sql);
	echo json_encode($result);
	//echo json_encode($sql);
}

function delRecordByAccount($data){
	$sql = "delete from trade_record where oppositeAccount = '$data->account' and caseID = '$data->caseID'";
	$result = mysql_query($sql);
	echo json_encode($result);
}

?>