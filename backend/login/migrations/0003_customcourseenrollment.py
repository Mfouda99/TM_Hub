from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('login', '0002_member_position'),
    ]

    operations = [
        migrations.CreateModel(
            name='CustomCourseEnrollment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('custom_course_id', models.IntegerField()),
                ('course_title', models.TextField(blank=True, default='')),
                ('enrolled_at', models.DateTimeField(auto_now_add=True)),
                ('member', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='custom_enrollments', to='login.member')),
            ],
            options={
                'db_table': 'custom_course_enrollments',
            },
        ),
        migrations.AlterUniqueTogether(
            name='customcourseenrollment',
            unique_together={('member', 'custom_course_id')},
        ),
    ]
