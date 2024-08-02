resource "aws_db_instance" "hash_db" {
  allocated_storage    = 20
  engine               = "postgres"
  engine_version       = "12.4"
  instance_class       = "db.t3.micro"
  name                 = "hash_db"
  username             = "hash_db_user"
  password             = "hash_db_password"
  parameter_group_name = "default.postgres12"
  skip_final_snapshot  = true
  publicly_accessible  = false
  vpc_security_group_ids = [module.vpc.default_security_group_id]
  db_subnet_group_name = aws_db_subnet_group.main.name
}

resource "aws_db_instance" "metadata_db" {
  allocated_storage    = 20
  engine               = "postgres"
  engine_version       = "12.4"
  instance_class       = "db.t3.micro"
  name                 = "metadata_db"
  username             = "metadata_db_user"
  password             = "metadata_db_password"
  parameter_group_name = "default.postgres12"
  skip_final_snapshot  = true
  publicly_accessible  = false
  vpc_security_group_ids = [module.vpc.default_security_group_id]
  db_subnet_group_name = aws_db_subnet_group.main.name
}

resource "aws_db_subnet_group" "main" {
  name       = "main-subnet-group"
  subnet_ids = module.vpc.private_subnets

  tags = {
    Name = "main-subnet-group"
  }
}
